import Enquiry from '../models/Enquiry.js';
import Trainer from '../models/Trainer.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { pagination, paginatedData } from '../utils/pagination.js';
import { publishRealtimeChange } from '../services/realtimeService.js';

export const createEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.create(req.body);
  publishRealtimeChange(['Enquiries', 'Dashboard']);
  res.status(201).json({ success: true, message: 'Enquiry received', data: { enquiry: { id: enquiry.id, status: enquiry.status } } });
});
export const listEnquiries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([Enquiry.find(filter).populate('assignedTo', 'name specialization').sort({ createdAt: -1 }).skip(skip).limit(limit), Enquiry.countDocuments(filter)]);
  res.json({ success: true, message: 'Enquiries loaded', data: paginatedData(items, total, page, limit) });
});
export const updateEnquiry = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.assignedTo) {
    const trainer = await Trainer.exists({ _id: updates.assignedTo, isActive: true });
    if (!trainer) throw new ApiError(400, 'Assigned trainer is not active or does not exist');
  }
  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true }).populate('assignedTo', 'name specialization');
  if (!enquiry) throw new ApiError(404, 'Enquiry not found');
  publishRealtimeChange(['Enquiries', 'Dashboard']);
  res.json({ success: true, message: 'Enquiry updated', data: { enquiry } });
});