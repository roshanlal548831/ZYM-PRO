import WorkoutPlan from '../models/WorkoutPlan.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { publishRealtimeChange } from '../services/realtimeService.js';

export const myWorkouts = asyncHandler(async (req, res) => {
  const items = await WorkoutPlan.find({ assignedTo: req.user.id, isActive: true }).populate('createdBy', 'name').sort({ createdAt: -1 });
  res.json({ success: true, message: 'Workout plans loaded', data: { items } });
});
export const createWorkout = asyncHandler(async (req, res) => {
  if (req.body.assignedTo) {
    const member = await User.exists({ _id: req.body.assignedTo, role: 'member' });
    if (!member) throw new ApiError(400, 'Workout plans can only be assigned to members');
  }
  const workout = await WorkoutPlan.create({ ...req.body, createdBy: req.user.id });
  publishRealtimeChange(['Workouts'], { memberId: workout.assignedTo });
  res.status(201).json({ success: true, message: 'Workout plan created', data: { workout } });
});
export const updateWorkout = asyncHandler(async (req, res) => {
  const previous = await WorkoutPlan.findById(req.params.id).select('assignedTo');
  if (!previous) throw new ApiError(404, 'Workout plan not found');
  if (req.body.assignedTo) {
    const member = await User.exists({ _id: req.body.assignedTo, role: 'member' });
    if (!member) throw new ApiError(400, 'Workout plans can only be assigned to members');
  }
  const workout = await WorkoutPlan.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!workout) throw new ApiError(404, 'Workout plan not found');
  publishRealtimeChange(['Workouts'], { memberId: previous.assignedTo });
  if (String(workout.assignedTo || '') !== String(previous.assignedTo || '')) {
    publishRealtimeChange(['Workouts'], { memberId: workout.assignedTo });
  }
  res.json({ success: true, message: 'Workout plan updated', data: { workout } });
});

export const deactivateWorkout = asyncHandler(async (req, res) => {
  const workout = await WorkoutPlan.findByIdAndUpdate(req.params.id, { $set: { isActive: false } }, { new: true });
  if (!workout) throw new ApiError(404, 'Workout plan not found');
  publishRealtimeChange(['Workouts'], { memberId: workout.assignedTo });
  res.json({ success: true, message: 'Workout plan deactivated', data: { workout } });
});