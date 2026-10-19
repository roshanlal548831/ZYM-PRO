import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true },
  method: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: { type: String },
  responseStatus: { type: Number, required: true },
  ip: { type: String },
  userAgent: { type: String, maxlength: 500 }
}, { timestamps: true, versionKey: false });

schema.index({ createdAt: -1 });
export default mongoose.model('AuditLog', schema);