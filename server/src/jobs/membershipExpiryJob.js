import cron from 'node-cron';
import Membership from '../models/Membership.js';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { notifyEmail, notifyWhatsApp } from '../services/notificationService.js';
import { publishRealtimeChange } from '../services/realtimeService.js';

export async function processMembershipExpiries(now = new Date()) {
  const expired = await Membership.updateMany({ status: 'active', endDate: { $lte: now } }, { $set: { status: 'expired' } });
  const activated = await Membership.updateMany({ status: 'pending', paymentStatus: 'paid', startDate: { $lte: now }, endDate: { $gt: now } }, { $set: { status: 'active' } });
  if (expired.modifiedCount || activated.modifiedCount) publishRealtimeChange(['Memberships', 'Dashboard'], { members: true });
  const until = new Date(now);
  until.setUTCDate(until.getUTCDate() + env.REMINDER_WINDOW_DAYS);
  const due = await Membership.find({ status: 'active', paymentStatus: 'paid', endDate: { $gt: now, $lte: until } }).populate('user', 'name email phone').populate('membershipPlan', 'name');
  for (const membership of due) {
    const dateKey = membership.endDate.toISOString().slice(0, 10);
    const dedupeKey = `membership-expiry:${membership.id}:${dateKey}`;
    const message = `Hello ${membership.user.name}, your ${membership.membershipPlan.name} membership expires on ${dateKey}. Please contact the gym to renew.`;
    try {
      await notifyEmail({ user: membership.user._id, to: membership.user.email, template: 'membership-expiry-reminder', subject: 'Your gym membership is expiring', text: message, dedupeKey: `${dedupeKey}:email` });
    } catch { /* A delivery failure must not block expiry processing. */ }
    if (membership.user.phone && env.WHATSAPP_TEMPLATE_NAME && env.WHATSAPP_ACCESS_TOKEN) {
      try {
        await notifyWhatsApp({ user: membership.user._id, to: membership.user.phone, template: env.WHATSAPP_TEMPLATE_NAME, parameters: [membership.user.name, membership.membershipPlan.name, dateKey], dedupeKey: `${dedupeKey}:whatsapp` });
      } catch { /* A delivery failure must not block expiry processing. */ }
    }
  }
}

export function startMembershipExpiryJob() {
  return cron.schedule('0 9 * * *', () => processMembershipExpiries().catch(() => {}), { timezone: env.JOB_TIMEZONE });
}
