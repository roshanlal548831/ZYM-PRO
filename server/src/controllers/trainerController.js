import Trainer from '../models/Trainer.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { deletePreviousImage, uploadImage } from '../services/imageService.js';
import { publishRealtimeChange } from '../services/realtimeService.js';

const trainerFields = ['name', 'specialization', 'experienceYears', 'bio', 'imageUrl', 'availability', 'isActive'];
export const listTrainers = asyncHandler(async (req, res) => {
  const items = await Trainer.find({ isActive: true }).select('name specialization experienceYears bio imageUrl availability').sort({ name: 1 });
  res.json({ success: true, message: 'Trainers loaded', data: { items } });
});
export const createTrainer = asyncHandler(async (req, res) => {
  const fields = Object.fromEntries(Object.entries(req.body).filter(([key, value]) => trainerFields.includes(key) && value !== undefined));
  const uploaded = req.file ? await uploadImage(req.file.buffer, 'zym/trainers') : null;
  if (uploaded) {
    fields.imageUrl = uploaded.url;
    fields.imagePublicId = uploaded.publicId;
  }
  let trainer;
  try {
    trainer = await Trainer.create(fields);
  } catch (error) {
    if (uploaded) await deletePreviousImage(uploaded.publicId);
    throw error;
  }
  publishRealtimeChange(['Trainers'], { publicUpdate: true });
  res.status(201).json({ success: true, message: 'Trainer created', data: { trainer } });
});
export const updateTrainer = asyncHandler(async (req, res) => {
  const current = await Trainer.findById(req.params.id).select('+imagePublicId');
  if (!current) throw new ApiError(404, 'Trainer not found');
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key, value]) => trainerFields.includes(key) && value !== undefined));
  const uploaded = req.file ? await uploadImage(req.file.buffer, 'zym/trainers') : null;
  if (uploaded) {
    updates.imageUrl = uploaded.url;
    updates.imagePublicId = uploaded.publicId;
  } else if (Object.hasOwn(updates, 'imageUrl')) {
    updates.imagePublicId = null;
  }
  let trainer;
  try {
    trainer = await Trainer.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
  } catch (error) {
    if (uploaded) await deletePreviousImage(uploaded.publicId);
    throw error;
  }
  if (uploaded || Object.hasOwn(updates, 'imageUrl')) {
    await deletePreviousImage(current.imagePublicId, current.imageUrl, uploaded?.publicId);
  }
  if (!trainer) throw new ApiError(404, 'Trainer not found');
  publishRealtimeChange(['Trainers'], { publicUpdate: true });
  res.json({ success: true, message: 'Trainer updated', data: { trainer } });
});
export const deactivateTrainer = asyncHandler(async (req, res) => {
  const current = await Trainer.findById(req.params.id).select('+imagePublicId');
  if (!current) throw new ApiError(404, 'Trainer not found');
  const trainer = await Trainer.findByIdAndUpdate(req.params.id, {
    $set: { isActive: false },
    $unset: { imageUrl: 1, imagePublicId: 1 }
  }, { new: true });
  if (!trainer) throw new ApiError(404, 'Trainer not found');
  await deletePreviousImage(current.imagePublicId, current.imageUrl);
  publishRealtimeChange(['Trainers'], { publicUpdate: true });
  res.json({ success: true, message: 'Trainer deactivated', data: { trainer } });
});