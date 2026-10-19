import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true, maxlength: 3000 },
  enquiryType: { type: String, enum: ['general', 'trial'], default: 'general' },
  status: { type: String, enum: ['new', 'contacted', 'converted', 'closed'], default: 'new', index: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' }
}, { timestamps: true, versionKey: false });

schema.pre('validate', function normalizeContact() {
  if (this.phone) this.phone = this.phone.startsWith('+') ? this.phone : `+${this.phone}`;
});

export default mongoose.model('Enquiry', schema);