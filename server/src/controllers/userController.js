import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { deletePreviousImage, uploadImage } from '../services/imageService.js';
import { disconnectRealtimeUser, publishRealtimeChange } from '../services/realtimeService.js';

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('name email phone role isEmailVerified isPhoneVerified isActive profileImage createdAt updatedAt');
  res.json({ success: true, message: 'Account loaded', data: { user } });
});

export const updateMe = asyncHandler(async (req, res) => {
  const current = await User.findById(req.user.id).select('+profileImagePublicId');
  if (!current) throw new ApiError(404, 'User not found');
  const update = Object.fromEntries(Object.entries(req.body).filter(([, value]) => value !== undefined));
  if (Object.hasOwn(update, 'phone')) {
    if (update.phone) {
    const existing = await User.exists({ phone: update.phone, _id: { $ne: req.user.id } });
    if (existing) throw new ApiError(409, 'That phone number is already in use');
    }
    update.isPhoneVerified = false;
  }
  const uploaded = req.file ? await uploadImage(req.file.buffer, 'zym/profiles') : null;
  if (uploaded) {
    update.profileImage = uploaded.url;
    update.profileImagePublicId = uploaded.publicId;
  } else if (Object.hasOwn(update, 'profileImage')) {
    update.profileImagePublicId = null;
  }
  let user;
  try {
    user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true, runValidators: true })
      .select('name email phone role isEmailVerified isPhoneVerified isActive profileImage createdAt updatedAt');
  } catch (error) {
    if (uploaded) await deletePreviousImage(uploaded.publicId);
    throw error;
  }
  if (uploaded || Object.hasOwn(update, 'profileImage')) {
    await deletePreviousImage(current.profileImagePublicId, current.profileImage, uploaded?.publicId);
  }
  publishRealtimeChange(['Session', 'Members', 'Dashboard'], { memberId: req.user.id });
  res.json({ success: true, message: 'Account updated', data: { user } });
});

export const listMembers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const filter = { role: 'member' };
  if (req.query.isActive === 'true') filter.isActive = true;
  if (req.query.isActive === 'false') filter.isActive = false;
  const [items, total] = await Promise.all([
    User.find(filter).select('name email phone isEmailVerified isActive profileImage createdAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter)
  ]);
  res.json({ success: true, message: 'Members loaded', data: { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

export const setMemberStatus = asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'member' }, { $set: { isActive: req.body.isActive }, $inc: { tokenVersion: 1 } }, { new: true }).select('name email isActive');
  if (!user) throw new ApiError(404, 'Member not found');
  publishRealtimeChange(['Members', 'Dashboard'], { memberId: user._id });
  if (!user.isActive) disconnectRealtimeUser(user._id);
  res.json({ success: true, message: 'Member status updated', data: { user } });
});