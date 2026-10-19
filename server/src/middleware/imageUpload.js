import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      return callback(new ApiError(400, 'Image must be JPEG, PNG, WebP, or GIF'));
    }
    callback(null, true);
  }
}).single('image');

export default function imageUpload(req, res, next) {
  parser(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'Image must be 5 MB or smaller'
        : 'Only one image file is allowed in the image field';
      return next(new ApiError(400, message));
    }
    next(error);
  });
}