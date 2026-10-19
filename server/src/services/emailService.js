import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

let transporter;

function getTransporter() {
  if (!env.EMAIL_HOST || !env.EMAIL_USER || !env.EMAIL_PASS || !env.EMAIL_FROM) {
    throw new ApiError(503, 'Email delivery is not configured');
  }
  transporter ??= nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465,
    auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS }
  });
  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  const info = await getTransporter().sendMail({ from: env.EMAIL_FROM, to, subject, text, html });
  return { providerMessageId: info.messageId };
}