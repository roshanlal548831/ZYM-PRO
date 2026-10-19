import Membership from '../models/Membership.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { requestMembership, requestRenewal } from '../services/membershipService.js';
import { publishRealtimeChange } from '../services/realtimeService.js';

export const createMembership = asyncHandler(async (req, res) => {
  const membership = await requestMembership({ userId: req.user.id, planId: req.body.planId });
  publishRealtimeChange(['Memberships', 'Dashboard'], { memberId: req.user.id });
  res.status(201).json({ success: true, message: 'Membership request created. An administrator must record payment to activate it.', data: { membership } });
});
export const renewMembership = asyncHandler(async (req, res) => {
  const membership = await requestRenewal({ userId: req.user.id, membershipId: req.params.id });
  publishRealtimeChange(['Memberships', 'Dashboard'], { memberId: req.user.id });
  res.status(201).json({ success: true, message: 'Renewal request created', data: { membership } });
});
export const myMemberships = asyncHandler(async (req, res) => {
  const items = await Membership.find({ user: req.user.id }).populate('membershipPlan', 'name price durationDays').sort({ createdAt: -1 });
  res.json({ success: true, message: 'Memberships loaded', data: { items } });
});
export const listMemberships = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.userId) filter.user = req.query.userId;
  const [items, total] = await Promise.all([
    Membership.find(filter).populate('user', 'name email phone').populate('membershipPlan', 'name price durationDays').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Membership.countDocuments(filter)
  ]);
  res.json({ success: true, message: 'Memberships loaded', data: { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});
export const updateStatus = asyncHandler(async (req, res) => {
  const fields = req.body.status === 'cancelled' ? { status: 'cancelled' } : { status: 'active' };
  const filter = { _id: req.params.id };
  if (req.body.status === 'active') Object.assign(filter, { paymentStatus: 'paid', startDate: { $lte: new Date() }, endDate: { $gt: new Date() } });
  const membership = await Membership.findOneAndUpdate(filter, { $set: fields }, { new: true, runValidators: true });
  if (!membership) throw new ApiError(409, 'Membership not found or does not meet the requested status requirements');
  publishRealtimeChange(['Memberships', 'Dashboard'], { memberId: membership.user });
  res.json({ success: true, message: 'Membership status updated', data: { membership } });
});