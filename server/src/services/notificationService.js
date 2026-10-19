import NotificationLog from '../models/NotificationLog.js';
import { sendEmail } from './emailService.js';
import { sendWhatsAppTemplate } from './whatsappService.js';
import { publishRealtimeChange } from './realtimeService.js';

export async function deliverNotification({ user, channel, recipient, template, dedupeKey, send }) {
  let log = dedupeKey ? await NotificationLog.findOne({ dedupeKey }) : null;
  if (log?.status === 'sent') return log;
  if (log) {
    log.status = 'queued';
    log.errorCode = undefined;
    log = await log.save();
  } else {
    try {
      log = await NotificationLog.create({ user, channel, recipient, template, dedupeKey, status: 'queued' });
    } catch (error) {
      if (!dedupeKey || error.code !== 11000) throw error;
      log = await NotificationLog.findOne({ dedupeKey });
      if (log?.status === 'sent') return log;
      log.status = 'queued';
      log.errorCode = undefined;
      await log.save();
    }
  }
  try {
    const result = await send();
    log.status = 'sent';
    log.sentAt = new Date();
    log.providerMessageId = result.providerMessageId;
    await log.save();
    publishRealtimeChange(['Notifications']);
    return log;
  } catch (error) {
    log.status = 'failed';
    log.errorCode = error.providerCode || error.code || 'DELIVERY_FAILED';
    await log.save();
    publishRealtimeChange(['Notifications']);
    throw error;
  }
}

export async function notifyEmail({ user, to, template, subject, text, dedupeKey }) {
  return deliverNotification({ user, channel: 'email', recipient: to, template, dedupeKey, send: () => sendEmail({ to, subject, text }) });
}

export async function notifyWhatsApp({ user, to, template, parameters, dedupeKey }) {
  return deliverNotification({ user, channel: 'whatsapp', recipient: to, template, dedupeKey, send: () => sendWhatsAppTemplate({ to, template, parameters }) });
}