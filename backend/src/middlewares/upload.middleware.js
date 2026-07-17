const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { AppError } = require('../utils/errors');

// Use memory storage — files go to Cloudinary, not disk (required for Vercel serverless)
const memoryStorage = multer.memoryStorage();

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${file.mimetype} is not allowed.`, 400), false);
  }
};

/**
 * Upload a buffer to Cloudinary and return the result.
 * @param {Buffer} buffer
 * @param {object} options  - Cloudinary upload options (folder, public_id, etc.)
 */
const uploadToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', ...options },
      (err, result) => {
        if (err) reject(new AppError(err.message || 'Cloudinary upload failed', 500));
        else resolve(result);
      }
    );
    stream.end(buffer);
  });

/** Generic multer middleware factory — stores in memory, ready for Cloudinary */
const upload = (fieldName, allowedTypes = null, maxCount = 1) => {
  const types = allowedTypes || [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const multerUpload = multer({
    storage: memoryStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: fileFilter(types),
  });

  return maxCount === 1
    ? multerUpload.single(fieldName)
    : multerUpload.array(fieldName, maxCount);
};

module.exports = { upload, uploadToCloudinary };
