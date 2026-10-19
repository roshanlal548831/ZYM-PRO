import { allowedOrigins } from '../config/corsOptions.js';
import ApiError from '../utils/ApiError.js';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

export default function csrfProtection(req, res, next) {
  if (safeMethods.has(req.method)) return next();
  const origin = req.get('origin');
  if (origin && !allowedOrigins.includes(origin)) return next(new ApiError(403, 'Request origin is not allowed'));
  if (req.cookies?.accessToken && req.get('x-csrf-token') !== req.cookies.csrfToken) {
    return next(new ApiError(403, 'CSRF token is missing or invalid'));
  }
  next();
}