import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const twilioMock = vi.hoisted(() => {
  const createVerification = vi.fn();
  const createCheck = vi.fn();
  const services = vi.fn(() => ({
    verifications: { create: createVerification },
    verificationChecks: { create: createCheck }
  }));
  const createClient = vi.fn(() => ({ verify: { v2: { services } } }));
  return { createVerification, createCheck, services, createClient };
});

vi.mock('twilio', () => ({ default: twilioMock.createClient }));

import { env } from '../src/config/env.js';
import { assertSmsConfigured, checkVerificationSms, sendVerificationSms } from '../src/services/smsService.js';

describe('Twilio Verify configuration', () => {
  beforeEach(() => {
    twilioMock.createVerification.mockReset().mockResolvedValue({ sid: 'VE123' });
    twilioMock.createCheck.mockReset().mockResolvedValue({ status: 'approved' });
    twilioMock.services.mockClear();
    twilioMock.createClient.mockClear();
  });

  afterEach(() => {
    env.TWILIO_VERIFY_SERVICE_SID = 'VA00000000000000000000000000000000';
  });

  it('identifies the missing Verify Service SID', () => {
    env.TWILIO_VERIFY_SERVICE_SID = '';
    expect(() => assertSmsConfigured()).toThrow('TWILIO_VERIFY_SERVICE_SID');
  });

  it('accepts complete Twilio Verify configuration', () => {
    expect(() => assertSmsConfigured()).not.toThrow();
  });

  it('starts an SMS verification using the configured Verify service', async () => {
    await expect(sendVerificationSms({ to: '+919876543210' })).resolves.toEqual({ providerMessageId: 'VE123' });
    expect(twilioMock.services).toHaveBeenCalledWith(env.TWILIO_VERIFY_SERVICE_SID);
    expect(twilioMock.createVerification).toHaveBeenCalledWith({ to: '+919876543210', channel: 'sms' });
  });

  it('requires an E.164 number with a leading plus', async () => {
    await expect(sendVerificationSms({ to: '919876543210' }))
      .rejects.toThrow('E.164 format with a leading +');
    expect(twilioMock.createVerification).not.toHaveBeenCalled();
  });

  it('explains when Twilio rejects the destination number', async () => {
    twilioMock.createVerification.mockRejectedValueOnce(Object.assign(new Error('Invalid parameter: To'), {
      code: 60200,
      status: 400
    }));
    await expect(sendVerificationSms({ to: '+919876543210' }))
      .rejects.toThrow('Twilio rejected the phone number');
  });

  it('checks the submitted OTP using Twilio Verify', async () => {
    await expect(checkVerificationSms({ to: '+919876543210', code: '123456' })).resolves.toBe(true);
    expect(twilioMock.createCheck).toHaveBeenCalledWith({ to: '+919876543210', code: '123456' });
  });
});
