import twilio from 'twilio';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

export function assertSmsConfigured() {
  const missing = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_VERIFY_SERVICE_SID']
    .filter((key) => !env[key]);
  if (missing.length) {
    throw new ApiError(503, `Twilio SMS delivery is missing configuration: ${missing.join(', ')}`);
  }
}

function verifyService() {
  return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
    .verify.v2.services(env.TWILIO_VERIFY_SERVICE_SID);
}

export async function sendVerificationSms({ to }) {
  if (!/^\+[1-9]\d{7,14}$/.test(to)) {
    throw new ApiError(400, 'Phone number must use E.164 format with a leading +, for example +919876543210');
  }
  assertSmsConfigured();
  try {
    const verification = await verifyService().verifications.create({ to, channel: 'sms' });
    return { providerMessageId: verification.sid };
  } catch (error) {
    // Twilio errors are not ApiErrors, so without translation Express reports
    // provider rejections as an unhelpful 500.
    const providerCode = String(error.code || '');
    const statusCode = error.status === 429 || providerCode === '20429' || providerCode === '60203'
      ? 429
      : providerCode === '60200'
        ? 400
      : 502;
    const invalidParameter = providerCode === '60200'
      ? /Invalid parameter:\s*([A-Za-z]+)/i.exec(error.message || '')?.[1]
      : undefined;
    const message = statusCode === 429
      ? 'Too many verification messages were requested. Please wait before trying again.'
      : invalidParameter === 'To'
        ? 'Twilio rejected the phone number. Use E.164 international format with a leading +.'
        : invalidParameter === 'Channel'
          ? 'Twilio Verify rejected the SMS channel. Check that SMS is enabled for this Verify service.'
          : 'Twilio could not send the verification SMS. Check the phone number, Verify service configuration, and Twilio account SMS permissions.';
    const detail = invalidParameter
      ? `Twilio error code: ${providerCode} (invalid parameter: ${invalidParameter})`
      : `Twilio error code: ${providerCode || 'unknown'}`;
    throw new ApiError(statusCode, message, [{ field: 'sms', message: detail }]);
  }
}

export async function checkVerificationSms({ to, code }) {
  assertSmsConfigured();
  try {
    const check = await verifyService().verificationChecks.create({ to, code });
    return check.status === 'approved';
  } catch (error) {
    if (String(error.code) === '20404') return false;
    throw error;
  }
}
