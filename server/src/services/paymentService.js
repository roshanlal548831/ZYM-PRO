import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Membership from '../models/Membership.js';
import MembershipPlan from '../models/MembershipPlan.js';
import ApiError from '../utils/ApiError.js';
import generateReceipt from '../utils/generateReceipt.js';

function transactionUnsupported(error) {
  return [20, 251, 263].includes(error.code) || /replica set|transactions are not supported|transaction numbers are only allowed/i.test(error.message || '');
}

async function runWithOptionalTransaction(work) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(() => work(session));
  } catch (error) {
    if (!transactionUnsupported(error)) throw error;
    return work(null);
  } finally {
    await session.endSession();
  }
}

async function finalize(payment, actorId, session = null) {
  const options = session ? { session } : {};
  const existing = await Payment.findById(payment._id).session(session);
  if (!existing) throw new ApiError(404, 'Payment not found');
  if (existing.status === 'paid') throw new ApiError(409, 'Payment has already been confirmed');
  if (existing.status !== 'pending') throw new ApiError(409, 'Payment cannot be confirmed');
  const membership = await Membership.findOne({ _id: existing.membership, user: existing.member }).session(session);
  if (!membership) throw new ApiError(409, 'Membership is no longer awaiting payment');
  if (membership.paymentStatus === 'paid' && String(membership.payment) === String(existing._id)) {
    const recovered = await Payment.findOneAndUpdate({ _id: existing._id, status: 'pending' }, {
      $set: { status: 'paid', paidAt: new Date(), receiptNumber: generateReceipt() },
      $push: { statusHistory: { status: 'paid', changedBy: actorId, changedAt: new Date(), note: 'Recovered after an interrupted confirmation' } }
    }, { new: true, runValidators: true, ...options });
    if (recovered) return recovered;
  }
  if (membership.paymentStatus !== 'pending' || membership.status !== 'pending') throw new ApiError(409, 'Membership is no longer awaiting payment');
  if (existing.amount !== membership.amountDue) throw new ApiError(409, 'Payment amount does not match the membership request');
  const now = new Date();
  const updatedMembership = await Membership.findOneAndUpdate(
    { _id: membership._id, paymentStatus: 'pending', status: 'pending' },
    { $set: { paymentStatus: 'paid', payment: existing._id, status: membership.startDate <= now ? 'active' : 'pending' } },
    { new: true, runValidators: true, ...options }
  );
  if (!updatedMembership) throw new ApiError(409, 'Membership payment was already processed');
  const updatedPayment = await Payment.findOneAndUpdate(
    { _id: existing._id, status: 'pending' },
    { $set: { status: 'paid', paidAt: now, receiptNumber: generateReceipt() }, $push: { statusHistory: { status: 'paid', changedBy: actorId, changedAt: now } } },
    { new: true, runValidators: true, ...options }
  );
  if (!updatedPayment) throw new ApiError(409, 'Payment was already processed');
  return updatedPayment;
}

export async function recordAndConfirmPayment(input, actorId) {
  const membership = await Membership.findOne({ _id: input.membershipId, user: input.memberId, status: 'pending', paymentStatus: 'pending' });
  if (!membership) throw new ApiError(404, 'Pending membership request not found');
  if (input.amount !== membership.amountDue) throw new ApiError(400, 'Payment amount must match the membership request amount');
  if (await Payment.exists({ membership: membership._id, status: { $in: ['pending', 'paid'] } })) throw new ApiError(409, 'A payment already exists for this membership');

  const payment = await Payment.create({
    member: input.memberId, membership: membership._id, amount: input.amount, method: input.method,
    transactionReference: input.transactionReference, notes: input.notes, recordedBy: actorId, status: 'pending', activeMembershipKey: String(membership._id),
    statusHistory: [{ status: 'pending', changedBy: actorId, note: 'Recorded by administrator' }]
  });
  try {
    const result = await runWithOptionalTransaction((session) => finalize(payment, actorId, session));
    return result || Payment.findById(payment._id);
  } catch (error) {
    if (error instanceof ApiError) await Payment.deleteOne({ _id: payment._id, status: 'pending' });
    throw error;
  }
}

export async function confirmPayment(paymentId, actorId) {
  return runWithOptionalTransaction((session) => finalize({ _id: paymentId }, actorId, session));
}

export async function refundPayment(paymentId, actorId, reason) {
  return runWithOptionalTransaction(async (session) => {
    const options = session ? { session } : {};
    const payment = await Payment.findOneAndUpdate({ _id: paymentId, status: 'paid' }, {
      $set: { status: 'refunded' }, $unset: { activeMembershipKey: 1 },
      $push: { statusHistory: { status: 'refunded', changedBy: actorId, changedAt: new Date(), note: reason } }
    }, { new: true, ...options });
    if (!payment) throw new ApiError(409, 'Only confirmed payments can be refunded');
    await Membership.updateOne({ _id: payment.membership, paymentStatus: 'paid' }, { $set: { paymentStatus: 'refunded', status: 'cancelled' } }, options);
    return payment;
  });
}