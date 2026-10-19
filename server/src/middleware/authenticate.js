import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

export default async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.accessToken;
    if (!token) throw new ApiError(401, 'Authentication required');
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (payload.type !== 'access') throw new ApiError(401, 'Authentication required');
    const user = await User.findById(payload.sub).select('_id name email role isActive isEmailVerified tokenVersion');
    if (!user || !user.isActive || !user.isEmailVerified || payload.tokenVersion !== user.tokenVersion) {
      throw new ApiError(401, 'Authentication required');
    }
    req.user = user;
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, 'Authentication required'));
  }
}