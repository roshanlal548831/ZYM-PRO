import Payment from '../models/Payment.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { confirmPayment, recordAndConfirmPayment, refundPayment } from '../services/paymentService.js';
import { pagination, paginatedData } from '../utils/pagination.js';
import { notifyEmail } from '../services/notificationService.js';
import User from '../models/User.js';
import { publishRealtimeChange } from '../services/realtimeService.js';

export const createPayment = asyncHandler(async (req, res) => {
  const payment = await recordAndConfirmPayment(req.body, req.user.id);
  publishRealtimeChange(['Payments', 'Memberships', 'Dashboard', 'Reports'], { memberId: payment.member });
  const member = await User.findById(payment.member);
  if (member) {
    try {
      await notifyEmail({ user: member._id, to: member.email, template: 'payment-confirmation', subject: 'Gym payment confirmed', text: `Your payment of INR ${payment.amount.toFixed(2)} was confirmed. Receipt: ${payment.receiptNumber}.` });
    } catch { /* Delivery is logged; payment state remains authoritative. */ }
  }
  res.status(201).json({ success: true, message: 'Payment recorded and confirmed', data: { payment } });
});
export const myPayments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const [items, total] = await Promise.all([Payment.find({ member: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(limit), Payment.countDocuments({ member: req.user.id })]);
  res.json({ success: true, message: 'Payment history loaded', data: paginatedData(items, total, page, limit) });
});
export const listPayments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.memberId) filter.member = req.query.memberId;
  const [items, total] = await Promise.all([
    Payment.find(filter).populate('member', 'name email').populate('membership', 'status startDate endDate').populate('recordedBy', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Payment.countDocuments(filter)
  ]);
  res.json({ success: true, message: 'Payments loaded', data: paginatedData(items, total, page, limit) });
});
export const confirm = asyncHandler(async (req, res) => {
  const payment = await confirmPayment(req.params.id, req.user.id);
  publishRealtimeChange(['Payments', 'Memberships', 'Dashboard', 'Reports'], { memberId: payment.member });
  res.json({ success: true, message: 'Payment confirmed', data: { payment } });
});
export const refund = asyncHandler(async (req, res) => {
  const payment = await refundPayment(req.params.id, req.user.id, req.body.reason);
  publishRealtimeChange(['Payments', 'Memberships', 'Dashboard', 'Reports'], { memberId: payment.member });
  res.json({ success: true, message: 'Refund recorded; original payment history is retained', data: { payment } });
});
export const getPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (req.user.role !== 'admin' && String(payment.member) !== String(req.user.id)) throw new ApiError(403, 'You are not permitted to view this payment');
  res.json({ success: true, message: 'Payment loaded', data: { payment } });
});