import { z } from 'zod';

const password = z.string().min(8).max(128);
const email = z.string().trim().toLowerCase().email().max(254);

export const registerSchema = z.object({ body: z.object({
  name: z.string().trim().min(2).max(100),
  email,
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/).optional(),
  password
}).strict() });

export const emailOtpSchema = z.object({ body: z.object({ email, otp: z.string().regex(/^\d{6}$/) }).strict() });
export const resendOtpSchema = z.object({ body: z.object({ email, purpose: z.enum(['signup', 'password-reset']).default('signup') }).strict() });
export const loginSchema = z.object({ body: z.object({ email, password: z.string().min(1).max(128) }).strict() });
export const emailOnlySchema = z.object({ body: z.object({ email }).strict() });
export const forgotPasswordSchema = z.object({ body: z.object({
  identifier: z.string().trim().min(1).max(254).refine(
    (value) => z.email().safeParse(value.toLowerCase()).success || /^\+?[1-9]\d{7,14}$/.test(value),
    'Enter a valid email or international phone number'
  )
}).strict() });
export const phoneOtpSchema = z.object({ body: z.object({ otp: z.string().regex(/^\d{6}$/) }).strict() });
export const resetOtpSchema = z.object({ body: z.object({ identifier: z.string().trim().min(1).max(254), otp: z.string().regex(/^\d{6}$/) }).strict() });
export const resetPasswordSchema = z.object({ body: z.object({ password }).strict() });
export const changePasswordSchema = z.object({ body: z.object({ currentPassword: z.string().min(1).max(128), newPassword: password }).strict() });