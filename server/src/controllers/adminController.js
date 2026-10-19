import User from '../models/User.js';
import Membership from '../models/Membership.js';
import Payment from '../models/Payment.js';
import Enquiry from '../models/Enquiry.js';
import NotificationLog from '../models/NotificationLog.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { pagination, paginatedData } from '../utils/pagination.js';
import { env } from '../config/env.js';
import { disconnectRealtimeUser, publishRealtimeChange } from '../services/realtimeService.js';

function expiryRange() {
  const now = new Date();
  const until = new Date(now);
  until.setUTCDate(until.getUTCDate() + env.REMINDER_WINDOW_DAYS);
  return { $gte: now, $lte: until };
}

export const dashboard = asyncHandler(async (req, res) => {
  const range = expiryRange();
  const [totalMembers, activeMemberships, pendingMemberships, expiringMemberships, payments, pendingPayments, newEnquiries] = await Promise.all([
    User.countDocuments({ role: 'member' }),
    Membership.countDocuments({ status: 'active', paymentStatus: 'paid', endDate: { $gt: new Date() } }),
    Membership.countDocuments({ status: 'pending', paymentStatus: 'pending' }),
    Membership.countDocuments({ status: 'active', paymentStatus: 'paid', endDate: range }),
    Payment.aggregate([{ $match: { status: { $in: ['paid', 'refunded'] } } }, { $group: { _id: { currency: '$currency', status: '$status' }, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    Payment.countDocuments({ status: 'pending' }),
    Enquiry.countDocuments({ status: 'new' })
  ]);
  res.json({ success: true, message: 'Dashboard loaded', data: { totalMembers, activeMemberships, pendingMemberships, expiringMemberships, confirmedPayments: payments, pendingPayments, newEnquiries } });
});

export const members = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const filter = { role: 'member' };
  if (req.query.isActive === 'true') filter.isActive = true;
  if (req.query.isActive === 'false') filter.isActive = false;
  if (req.query.search) filter.$or = [{ name: new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, { email: new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }];
  const [items, total] = await Promise.all([User.find(filter).select('name email phone isEmailVerified isActive createdAt').sort({ createdAt: -1 }).skip(skip).limit(limit), User.countDocuments(filter)]);
  res.json({ success: true, message: 'Members loaded', data: paginatedData(items, total, page, limit) });
});

export const memberStatus = asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'member' }, { $set: { isActive: req.body.isActive }, $inc: { tokenVersion: 1 } }, { new: true }).select('name email isActive');
  if (!user) throw new ApiError(404, 'Member not found');
  publishRealtimeChange(['Members', 'Dashboard'], { memberId: user._id });
  if (!user.isActive) disconnectRealtimeUser(user._id);
  res.json({ success: true, message: 'Member status updated', data: { user } });
});

export const paymentSummary = asyncHandler(async (req, res) => {
  const match = { status: { $in: ['paid', 'refunded'] } };
  if (req.query.from || req.query.to) {
    match.createdAt = {};
    if (req.query.from) match.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) match.createdAt.$lte = new Date(req.query.to);
  }
  const result = await Payment.aggregate([
    { $match: match },
    { $group: { _id: { currency: '$currency', status: '$status' }, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { '_id.currency': 1, '_id.status': 1 } }
  ]);
  res.json({ success: true, message: 'Payment summary loaded', data: { items: result } });
});

export const expiringMemberships = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const filter = { status: 'active', paymentStatus: 'paid', endDate: expiryRange() };
  const [items, total] = await Promise.all([Membership.find(filter).populate('user', 'name email phone').populate('membershipPlan', 'name').sort({ endDate: 1 }).skip(skip).limit(limit), Membership.countDocuments(filter)]);
  res.json({ success: true, message: 'Expiring memberships loaded', data: paginatedData(items, total, page, limit) });
});

export const notifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const filter = {};
  if (req.query.channel) filter.channel = req.query.channel;
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([NotificationLog.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit), NotificationLog.countDocuments(filter)]);
  res.json({ success: true, message: 'Notification logs loaded', data: paginatedData(items, total, page, limit) });
});
