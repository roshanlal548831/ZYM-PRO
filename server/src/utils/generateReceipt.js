import { randomBytes } from 'node:crypto';

export default function generateReceipt() {
  return `ZYM-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`;
}