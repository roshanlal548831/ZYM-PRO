import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  phone: { type: String, trim: true, default: undefined },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['member', 'admin'], default: 'member', immutable: true },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  profileImage: { type: String, trim: true },
  profileImagePublicId: { type: String, select: false },
  tokenVersion: { type: Number, default: 0, select: false }
}, { timestamps: true, versionKey: false });

userSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: 'string' } } });
userSchema.pre('validate', function normalizePhone() {
  if (this.phone) this.phone = this.phone.startsWith('+') ? this.phone : `+${this.phone}`;
});
userSchema.set('toJSON', { transform(_doc, ret) { delete ret.password; delete ret.tokenVersion; return ret; } });

export default mongoose.model('User', userSchema);