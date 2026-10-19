import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  channel: { type: String, enum: ['email', 'whatsapp'], required: true },
  template: { type: String, required: true, trim: true },
  recipient: { type: String, required: true, trim: true },
  status: { type: String, enum: ['queued', 'sent', 'failed'], default: 'queued', index: true },
  providerMessageId: { type: String },
  errorCode: { type: String },
  sentAt: { type: Date },
  dedupeKey: { type: String }
}, { timestamps: true, versionKey: false });

schema.index({ dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } });
schema.index({ createdAt: -1 });
schema.set('toJSON', { transform(_doc, ret) {
  if (ret.recipient.includes('@')) ret.recipient = ret.recipient.replace(/^(.).+(@.*)$/, '$1***$2');
  else ret.recipient = ret.recipient.replace(/\d(?=\d{4})/g, '*');
  return ret;
} });

export default mongoose.model('NotificationLog', schema);