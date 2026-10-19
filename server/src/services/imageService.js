import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const configured = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

if (configured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

function requireCloudinary() {
  if (!configured) throw new ApiError(503, 'Image uploads are not configured');
}

export function uploadImage(buffer, folder) {
  requireCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
      if (error) return reject(new ApiError(502, 'Image upload failed'));
      resolve({ url: result.secure_url, publicId: result.public_id });
    });
    stream.end(buffer);
  });
}

export async function deleteImage(publicId) {
  if (!publicId) return;
  requireCloudinary();
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
  if (!['ok', 'not found'].includes(result.result)) throw new ApiError(502, 'Previous image could not be deleted');
}

export function cloudinaryPublicIdFromUrl(imageUrl) {
  if (!configured || !imageUrl) return null;
  try {
    const url = new URL(imageUrl);
    if (url.hostname !== `res.cloudinary.com` || url.pathname.split('/')[1] !== env.CLOUDINARY_CLOUD_NAME) return null;
    const uploadPath = url.pathname.split('/image/upload/')[1];
    if (!uploadPath) return null;
    const parts = uploadPath.split('/').filter(Boolean);
    while (parts.length && (/^v\d+$/.test(parts[0]) || /^(?:[a-z]_[^/]+)(?:,[a-z]_[^/]+)*$/.test(parts[0]))) parts.shift();
    if (!parts.length) return null;
    parts[parts.length - 1] = parts.at(-1).replace(/\.[^.]+$/, '');
    return parts.join('/') || null;
  } catch {
    return null;
  }
}

export async function deletePreviousImage(publicId, imageUrl, replacementPublicId) {
  if (publicId && publicId === replacementPublicId) return;
  await deleteImage(publicId || cloudinaryPublicIdFromUrl(imageUrl));
}