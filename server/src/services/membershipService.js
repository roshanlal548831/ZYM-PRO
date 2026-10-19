import Membership from '../models/Membership.js';
import MembershipPlan from '../models/MembershipPlan.js';
import ApiError from '../utils/ApiError.js';

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export async function requestMembership({ userId, planId, createdBy = userId }) {
  const plan = await MembershipPlan.findOne({ _id: planId, isActive: true });
  if (!plan) throw new ApiError(404, 'Membership plan not found');
  const outstanding = await Membership.exists({ user: userId, status: 'pending' });
  if (outstanding) throw new ApiError(409, 'You already have a pending membership request');
  const now = new Date();
  const current = await Membership.findOne({ user: userId, status: 'active', paymentStatus: 'paid', endDate: { $gt: now } }).sort({ endDate: -1 });
  const startDate = current ? new Date(current.endDate) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const endDate = addDays(startDate, plan.durationDays);
  const membership = await Membership.create({ user: userId, membershipPlan: plan._id, amountDue: plan.price, startDate, endDate, status: 'pending', paymentStatus: 'pending', createdBy });
  return membership.populate('membershipPlan', 'name price durationDays');
}

export async function requestRenewal({ userId, membershipId }) {
  const source = await Membership.findOne({ _id: membershipId, user: userId, paymentStatus: 'paid', status: { $in: ['active', 'expired'] } });
  if (!source) throw new ApiError(404, 'Membership not found');
  return requestMembership({ userId, planId: source.membershipPlan, createdBy: userId });
}

export function addMembershipDays(date, days) {
  return addDays(date, days);
}