import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

const createLimiter = (limit, windowMs) => rateLimit({
  windowMs,
  limit,
  skip: () => env.NODE_ENV === 'test',
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.', errors: [] }
});

export const authLimiter = createLimiter(10, 15 * 60 * 1000);
export const otpLimiter = createLimiter(5, 15 * 60 * 1000);
export const enquiryLimiter = createLimiter(5, 60 * 60 * 1000);