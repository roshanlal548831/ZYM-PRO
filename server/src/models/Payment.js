import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  membership: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership', required: true, index: true },
  amount: { type: Number, required: true, min: 0.01 },
  currency: { type: String, enum: ['INR'], default: 'INR' },
  method: { type: String, enum: ['cash', 'upi'], required: true },
  status: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending', index: true },
  transactionReference: { type: String, trim: true, maxlength: 150 },
  receiptNumber: { type: String, unique: true, sparse: true },
  activeMembershipKey: { type: String, unique: true, sparse: true, select: false },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  paidAt: { type: Date },
  notes: { type: String, trim: true, maxlength: 1000, default: '' },
  statusHistory: [{ status: { type: String, enum: ['pending', 'paid', 'refunded'], required: true }, changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, changedAt: { type: Date, default: Date.now }, note: { type: String, maxlength: 500 } }]
}, { timestamps: true, versionKey: false });

schema.index({ member: 1, createdAt: -1 });
export default mongoose.model('Payment', schema);