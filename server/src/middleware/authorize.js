import ApiError from '../utils/ApiError.js';

export default function authorize(...roles) {
  return function authorizeRole(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) return next(new ApiError(403, 'You are not permitted to perform this action'));
    next();
  };
}