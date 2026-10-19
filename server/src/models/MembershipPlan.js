import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  price: { type: Number, required: true, min: 0 },
  durationDays: { type: Number, required: true, min: 1, max: 3650 },
  features: { type: [String], default: [] },
  isActive: { type: Boolean, default: true }
}, { timestamps: true, versionKey: false });

export default mongoose.model('MembershipPlan', schema);