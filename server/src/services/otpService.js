import { createHmac, timingSafeEqual } from 'node:crypto';
import OTP from '../models/OTP.js';
import { env } from '../config/env.js';
import generateOtp from '../utils/generateOtp.js';
import ApiError from '../utils/ApiError.js';
import { notifyEmail, notifySms } from './notificationService.js';
import { assertSmsConfigured, checkVerificationSms } from './smsService.js';

function hashOtp(value) {
  return createHmac('sha256', env.OTP_PEPPER).update(value).digest('hex');
}

export async function issueOtp({ email, phone, purpose, user }) {
  if (!email) assertSmsConfigured();
  const contact = email ? { email } : { phone };
  const now = new Date();
  const existing = await OTP.findOne({ ...contact, purpose }).sort({ createdAt: -1 });
  if (existing && now - existing.lastSentAt < env.OTP_RESEND_COOLDOWN_SECONDS * 1000) {
    throw new ApiError(429, 'Please wait before requesting another code');
  }
  if (existing && existing.resendCount >= env.OTP_MAX_RESENDS) throw new ApiError(429, 'OTP resend limit reached');
  const code = email ? generateOtp() : null;
  const expiresAt = new Date(now.getTime() + env.OTP_TTL_MINUTES * 60 * 1000);
  const challenge = existing || new OTP({ ...contact, purpose });
  challenge.codeHash = code ? hashOtp(code) : undefined;
  challenge.expiresAt = expiresAt;
  challenge.attempts = 0;
  challenge.resendCount = existing ? existing.resendCount + 1 : 0;
  challenge.lastSentAt = now;
  challenge.verifiedAt = null;
  if (email) {
    await challenge.save();
    const label = purpose === 'signup' ? 'email verification' : 'password reset';
    await notifyEmail({
      user, to: email, template: purpose === 'signup' ? 'signup-otp' : 'password-reset-otp',
      subject: purpose === 'signup' ? 'Verify your gym account' : 'Reset your gym account password',
      text: `Your ${label} code is ${code}. It expires in ${env.OTP_TTL_MINUTES} minutes. If you did not request this, ignore this email.`
    });
  } else {
    // Validate phone format before sending SMS via Twilio Verify
    if (!/^\\+[1-9]\\d{7,14}$/.test(phone)) {
      // Bad format – same error shape as smsService for consistency
      const { ApiError } = await import('../utils/ApiError.js');
      throw new ApiError(400, 'Phone number must be in E.164 format with a leading + (e.g., +919876543210)');
    }
    await notifySms({ user, to: phone, template: 'phone-otp' });
    // A failed provider call must not start the local resend cooldown.
    await challenge.save();
  }
}

export async function issueEmailOtp(input) {
  return issueOtp(input);
}

export async function verifyOtp({ email, phone, purpose, code }) {
  const otp = await OTP.findOne({ ...(email ? { email } : { phone }), purpose, expiresAt: { $gt: new Date() }, verifiedAt: null }).select('+codeHash').sort({ createdAt: -1 });
  if (!otp || otp.attempts >= env.OTP_MAX_ATTEMPTS) throw new ApiError(400, 'Invalid or expired verification code');
  let matches;
  if (phone) {
    matches = await checkVerificationSms({ to: phone, code });
  } else {
    const actual = Buffer.from(hashOtp(code), 'hex');
    const expected = Buffer.from(otp.codeHash, 'hex');
    matches = actual.length === expected.length && timingSafeEqual(actual, expected);
  }
  if (!matches) {
    await OTP.updateOne({ _id: otp._id, attempts: otp.attempts }, { $inc: { attempts: 1 } });
    throw new ApiError(400, 'Invalid or expired verification code');
  }
  const updated = await OTP.findOneAndUpdate(
    { _id: otp._id, verifiedAt: null, attempts: { $lt: env.OTP_MAX_ATTEMPTS } },
    { $set: { verifiedAt: new Date() } }, { new: true }
  );
  if (!updated) throw new ApiError(400, 'Invalid or expired verification code');
  return updated;
}

export async function verifyEmailOtp(input) {
  return verifyOtp(input);
}
