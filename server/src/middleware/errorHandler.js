import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';

export default function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let errors = error.errors || [];

  if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Invalid resource identifier';
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(error.errors).map(({ path, message: detail }) => ({ field: path, message: detail }));
  } else if (error.code === 11000) {
    statusCode = 409;
    message = 'A record with that value already exists';
  } else if (!error.isOperational) {
    statusCode = 500;
    message = 'Internal server error';
  }

  res.status(statusCode).json({ success: false, message, errors });
}
