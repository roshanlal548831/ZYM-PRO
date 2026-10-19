import MembershipPlan from '../models/MembershipPlan.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { publishRealtimeChange } from '../services/realtimeService.js';

export const listPlans = asyncHandler(async (req, res) => {
  const plans = await MembershipPlan.find({ isActive: true }).sort({ price: 1 });
  res.json({ success: true, message: 'Membership plans loaded', data: { items: plans } });
});
export const createPlan = asyncHandler(async (req, res) => {
  const plan = await MembershipPlan.create(req.body);
  publishRealtimeChange(['Plans'], { publicUpdate: true });
  res.status(201).json({ success: true, message: 'Membership plan created', data: { plan } });
});
export const updatePlan = asyncHandler(async (req, res) => {
  const plan = await MembershipPlan.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!plan) throw new ApiError(404, 'Membership plan not found');
  publishRealtimeChange(['Plans'], { publicUpdate: true });
  res.json({ success: true, message: 'Membership plan updated', data: { plan } });
});
export const deactivatePlan = asyncHandler(async (req, res) => {
  const plan = await MembershipPlan.findByIdAndUpdate(req.params.id, { $set: { isActive: false } }, { new: true });
  if (!plan) throw new ApiError(404, 'Membership plan not found');
  publishRealtimeChange(['Plans'], { publicUpdate: true });
  res.json({ success: true, message: 'Membership plan deactivated', data: { plan } });
});