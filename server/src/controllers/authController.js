import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import { issueEmailOtp, issueOtp, verifyEmailOtp, verifyOtp } from '../services/otpService.js';
import { disconnectRealtimeUser } from '../services/realtimeService.js';

const cookieBase = { httpOnly: true, secure: env.COOKIE_SECURE || env.NODE_ENV === 'production', sameSite: env.COOKIE_SAME_SITE, path: '/' };
function durationMs(value) {
  const match = /^(\d+)(s|m|h|d)$/.exec(value);
  if (!match) return 15 * 60_000;
  const factors = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return Number(match[1]) * factors[match[2]];
}

function setAccessCookies(res, user) {
  const accessToken = jwt.sign({ sub: user.id, type: 'access', tokenVersion: user.tokenVersion }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  const csrfToken = randomBytes(32).toString('hex');
  res.cookie('accessToken', accessToken, { ...cookieBase, maxAge: durationMs(env.JWT_EXPIRES_IN) });
  res.cookie('csrfToken', csrfToken, { ...cookieBase, httpOnly: false, maxAge: durationMs(env.JWT_EXPIRES_IN) });
  return csrfToken;
}

function clearAuthCookies(res) {
  for (const name of ['accessToken', 'csrfToken', 'resetToken']) res.clearCookie(name, cookieBase);
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists');
  const user = await User.create({ name, email, phone, password: await bcrypt.hash(password, 12), role: 'member' });
  try {
    await issueEmailOtp({ email: user.email, purpose: 'signup', user: user._id });
  } catch (error) {
    await User.deleteOne({ _id: user._id, isEmailVerified: false });
    throw error;
  }
  res.status(201).json({ success: true, message: 'Account created. Check your email for a verification code.', data: { user: { id: user.id, name: user.name, email: user.email, isEmailVerified: false } } });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const challenge = await verifyEmailOtp({ email, purpose: 'signup', code: otp });
  const user = await User.findOneAndUpdate({ email: challenge.email, isEmailVerified: false }, { $set: { isEmailVerified: true } }, { new: true }).select('+tokenVersion');
  if (!user) throw new ApiError(400, 'Account could not be verified');
  await OTP.deleteOne({ _id: challenge._id });
  const csrfToken = setAccessCookies(res, user);
  res.json({ success: true, message: 'Email verified and signed in successfully', data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, csrfToken } });
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { email, purpose } = req.body;
  const user = await User.findOne({ email });
  if (user && ((purpose === 'signup' && !user.isEmailVerified) || purpose === 'password-reset')) {
    await issueEmailOtp({ email, purpose, user: user._id });
  }
  res.json({ success: true, message: 'If the account is eligible, a code has been sent.', data: {} });
});

export const resendPhoneOtp = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user.phone) throw new ApiError(400, 'Add a phone number to your profile first');
  if (user.isPhoneVerified) throw new ApiError(409, 'Phone number is already verified');
  await issueOtp({ phone: user.phone, purpose: 'phone-verification', user: user._id });
  res.json({ success: true, message: 'A phone verification code has been sent.', data: {} });
});

export const verifyPhoneOtp = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user.phone) throw new ApiError(400, 'Add a phone number to your profile first');
  const challenge = await verifyOtp({ phone: user.phone, purpose: 'phone-verification', code: req.body.otp });
  const updated = await User.findOneAndUpdate({ _id: user._id, phone: challenge.phone }, { $set: { isPhoneVerified: true } }, { new: true }).select('name email phone isPhoneVerified');
  if (!updated) throw new ApiError(400, 'Phone number could not be verified');
  await OTP.deleteOne({ _id: challenge._id });
  res.json({ success: true, message: 'Phone number verified successfully', data: { user: updated } });
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password +tokenVersion');
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) throw new ApiError(401, 'Invalid email or password');
  if (!user.isEmailVerified) throw new ApiError(403, 'Verify your email before signing in');
  if (!user.isActive) throw new ApiError(403, 'This account is disabled');
  const csrfToken = setAccessCookies(res, user);
  res.json({ success: true, message: 'Signed in successfully', data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, csrfToken } });
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user?.id) {
    await User.updateOne({ _id: req.user.id }, { $inc: { tokenVersion: 1 } });
    disconnectRealtimeUser(req.user.id);
  }
  clearAuthCookies(res);
  res.json({ success: true, message: 'Signed out successfully', data: {} });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Account loaded', data: { user: req.user } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const identifier = req.body.identifier.trim();
  const isEmail = identifier.includes('@');
  const value = isEmail ? identifier.toLowerCase() : (identifier.startsWith('+') ? identifier : `+${identifier}`);
  const field = isEmail ? 'email' : 'phone';
  const verifiedField = isEmail ? 'isEmailVerified' : 'isPhoneVerified';
  const user = await User.findOne({ [field]: value, isActive: true, [verifiedField]: true });
  if (user && isEmail) {
    try {
      await issueEmailOtp({ email: user.email, purpose: 'password-reset', user: user._id });
    } catch {
      // Keep account existence and delivery state indistinguishable to callers.
    }
  } else if (user) {
    try {
      await issueOtp({ phone: user.phone, purpose: 'password-reset', user: user._id });
    } catch {
      // Keep account existence and delivery state indistinguishable to callers.
    }
  }
  res.json({ success: true, message: 'If an account exists, password reset instructions have been sent.', data: {} });
});

export const verifyResetOtp = asyncHandler(async (req, res) => {
  const identifier = req.body.identifier.trim();
  const isEmail = identifier.includes('@');
  const value = isEmail ? identifier.toLowerCase() : (identifier.startsWith('+') ? identifier : `+${identifier}`);
  const field = isEmail ? 'email' : 'phone';
  const challenge = await verifyOtp({ [field]: value, purpose: 'password-reset', code: req.body.otp });
  const user = await User.findOne({ [field]: value, isActive: true }).select('+tokenVersion');
  if (!user) throw new ApiError(400, 'Invalid or expired verification code');
  const resetToken = jwt.sign({ sub: user.id, type: 'reset', tokenVersion: user.tokenVersion, otpId: challenge.id }, env.JWT_SECRET, { expiresIn: '10m' });
  res.cookie('resetToken', resetToken, { ...cookieBase, maxAge: 10 * 60_000 });
  res.json({ success: true, message: 'Code verified. You can now choose a new password.', data: {} });
});

export const resetPassword = asyncHandler(async (req, res) => {
  let payload;
  try { payload = jwt.verify(req.cookies?.resetToken || '', env.JWT_SECRET); } catch { throw new ApiError(401, 'Password reset session is invalid or expired'); }
  if (payload.type !== 'reset') throw new ApiError(401, 'Password reset session is invalid or expired');
  const otp = await OTP.findOne({ _id: payload.otpId, verifiedAt: { $ne: null }, expiresAt: { $gt: new Date() } });
  if (!otp) throw new ApiError(401, 'Password reset session is invalid or expired');
  const result = await User.updateOne({ _id: payload.sub, tokenVersion: payload.tokenVersion, isActive: true }, { $set: { password: await bcrypt.hash(req.body.password, 12) }, $inc: { tokenVersion: 1 } });
  if (!result.modifiedCount) throw new ApiError(401, 'Password reset session is invalid or expired');
  await OTP.deleteOne({ _id: otp._id });
  disconnectRealtimeUser(payload.sub);
  clearAuthCookies(res);
  res.json({ success: true, message: 'Password reset successfully. Sign in with your new password.', data: {} });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+password +tokenVersion');
  if (!(await bcrypt.compare(req.body.currentPassword, user.password))) throw new ApiError(400, 'Current password is incorrect');
  user.password = await bcrypt.hash(req.body.newPassword, 12);
  user.tokenVersion += 1;
  await user.save();
  disconnectRealtimeUser(user._id);
  clearAuthCookies(res);
  res.json({ success: true, message: 'Password changed. Please sign in again.', data: {} });
});
