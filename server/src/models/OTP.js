import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  purpose: { type: String, enum: ['signup', 'phone-verification', 'password-reset'], required: true },
  codeHash: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0, min: 0 },
  resendCount: { type: Number, default: 0, min: 0 },
  lastSentAt: { type: Date, required: true },
  verifiedAt: { type: Date, default: null }
}, { timestamps: true, versionKey: false });

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1, purpose: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
otpSchema.index({ phone: 1, purpose: 1 }, { unique: true, partialFilterExpression: { phone: { $type: 'string' } } });

export default mongoose.model('OTP', otpSchema);