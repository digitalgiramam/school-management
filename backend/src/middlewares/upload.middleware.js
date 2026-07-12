const multer = require('multer');
const path = require('path');
const config = require('../config');
const { AppError } = require('../utils/errors');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.path);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${file.mimetype} is not allowed.`, 400), false);
  }
};

/** Generic upload middleware factory */
const upload = (fieldName, allowedTypes = null, maxCount = 1) => {
  const types = allowedTypes || [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const multerUpload = multer({
    storage,
    limits: { fileSize: config.upload.maxSizeMb * 1024 * 1024 },
    fileFilter: fileFilter(types),
  });

  return maxCount === 1
    ? multerUpload.single(fieldName)
    : multerUpload.array(fieldName, maxCount);
};

module.exports = { upload };
