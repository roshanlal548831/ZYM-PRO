import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, trim: true, maxlength: 3000, default: '' },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  exercises: [{ name: { type: String, required: true, trim: true }, sets: { type: Number, required: true, min: 1 }, reps: { type: String, required: true, trim: true }, restSeconds: { type: Number, required: true, min: 0 }, videoUrl: { type: String, trim: true } }],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true, versionKey: false });

export default mongoose.model('WorkoutPlan', schema);