import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';

export default async function optionalAuthenticate(req, _res, next) {
  const token = req.cookies?.accessToken;
  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      if (payload.type === 'access') {
        const user = await User.findById(payload.sub).select('_id name email role isActive isEmailVerified tokenVersion');
        if (user && user.isActive && user.isEmailVerified && payload.tokenVersion === user.tokenVersion) {
          req.user = user;
        }
      }
    } catch {
      // Logout should still clear cookies when the session is expired or invalid.
    }
  }
  next();
}
