const path = require('path');
const fs = require('fs');
const multer = require('multer');
const HTTP_STATUS = require('#constants/httpStatus');
const {
  DEFAULT_DESTINATION,
  ATTACHMENT_DESTINATIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE
} = require('#constants/attachment');

/**
 * Factory to create reusable Multer upload middleware
 * @param {Object} options
 * @param {string} [options.destination=DEFAULT_DESTINATION] default 'storage/app/upload'
 * @param {string[]} [options.allowedMimeTypes=ALLOWED_MIME_TYPES]
 * @param {number} [options.maxFileSize=MAX_FILE_SIZE]
 */
const createUploader = ({
  destination = DEFAULT_DESTINATION,
  allowedMimeTypes = ALLOWED_MIME_TYPES,
  maxFileSize = MAX_FILE_SIZE
} = {}) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const fullDest = path.resolve(process.cwd(), destination);
      if (!fs.existsSync(fullDest)) {
        fs.mkdirSync(fullDest, { recursive: true });
      }
      cb(null, fullDest);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uniqueSuffix}${ext}`);
    }
  });

  const EXT_TO_MIME = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };

  const fileFilter = (req, file, cb) => {
    // If client (e.g. Postman on certain OS) sends application/octet-stream or empty mimetype, fallback to extension
    if ((!file.mimetype || file.mimetype === 'application/octet-stream') && file.originalname) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (EXT_TO_MIME[ext]) {
        file.mimetype = EXT_TO_MIME[ext];
      }
    }

    if (allowedMimeTypes.length && !allowedMimeTypes.includes(file.mimetype)) {
      const error = new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`);
      error.code = 'INVALID_FILE_TYPE';
      return cb(error, false);
    }
    cb(null, true);
  };

  const upload = multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter
  });

  return {
    /**
     * Single file upload middleware with JSON error handler
     * @param {string} fieldName
     */
    single: (fieldName = 'attachment') => (req, res, next) => {
      upload.single(fieldName)(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
                success: false,
                message: `File too large. Maximum allowed size is ${maxFileSize / (1024 * 1024)}MB.`,
                errors: { [fieldName]: 'File size limit exceeded.' }
              });
            }
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
              success: false,
              message: err.message,
              errors: { [fieldName]: err.message }
            });
          }

          if (err.code === 'INVALID_FILE_TYPE') {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
              success: false,
              message: err.message,
              errors: { [fieldName]: err.message }
            });
          }

          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: err.message || 'File upload failed.'
          });
        }
        next();
      });
    }
  };
};

// Profile avatar uploader (stores into storage/app/profiles/)
const uploadProfile = createUploader({
  destination: ATTACHMENT_DESTINATIONS.PROFILES,
  allowedMimeTypes: ALLOWED_MIME_TYPES,
  maxFileSize: MAX_FILE_SIZE
});

module.exports = {
  createUploader,
  uploadProfile
};
