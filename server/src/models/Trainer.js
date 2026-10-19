import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  specialization: { type: String, required: true, trim: true, maxlength: 200 },
  experienceYears: { type: Number, required: true, min: 0, max: 80 },
  bio: { type: String, trim: true, maxlength: 3000, default: '' },
  imageUrl: { type: String, trim: true },
  imagePublicId: { type: String, select: false },
  availability: { type: [String], default: [] },
  isActive: { type: Boolean, default: true }
}, { timestamps: true, versionKey: false });

schema.set('toJSON', { transform(_doc, ret) { delete ret.imagePublicId; return ret; } });

export default mongoose.model('Trainer', schema);