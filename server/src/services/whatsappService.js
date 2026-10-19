import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

export async function sendWhatsAppTemplate({ to, template, parameters = [] }) {
  if (!/^\+?[1-9]\d{7,14}$/.test(to)) throw new ApiError(400, 'Invalid WhatsApp recipient number');
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    throw new ApiError(503, 'WhatsApp delivery is not configured');
  }
  const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp', to: to.replace(/^\+/, ''), type: 'template',
      template: { name: template, language: { code: 'en_US' }, components: parameters.length ? [{ type: 'body', parameters: parameters.map((text) => ({ type: 'text', text: String(text) })) }] : [] }
    })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new ApiError(502, 'WhatsApp provider rejected the notification');
    error.providerCode = result.error?.code ? String(result.error.code) : undefined;
    throw error;
  }
  return { providerMessageId: result.messages?.[0]?.id };
}