import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  membershipPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },
  amountDue: { type: Number, required: true, min: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'active', 'expired', 'cancelled'], default: 'pending', index: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true, versionKey: false });

schema.pre('validate', function validateDates() {
  if (this.endDate <= this.startDate) this.invalidate('endDate', 'End date must be after start date');
});
schema.index({ user: 1, status: 1, startDate: 1, endDate: 1 });
schema.index({ user: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

export default mongoose.model('Membership', schema);