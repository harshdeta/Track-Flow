const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');

/**
 * Receipt Upload Middleware (Multer)
 * Stores uploaded receipt images/PDFs to /uploads/receipts/
 *
 * Supported formats: jpeg, jpg, png, pdf, webp
 * Max file size: 5MB
 *
 * In production replace storage with S3/GCS:
 *   const multerS3 = require('multer-s3');
 *   storage = multerS3({ s3, bucket: 'receipts', ... });
 */

// ─── Ensure upload directory exists ──────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads/receipts');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── Disk Storage Config ──────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Format: receipt_<userId>_<timestamp>.<ext>
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `receipt_${req.user._id}_${Date.now()}${ext}`;
    cb(null, filename);
  },
});

// ─── File Filter ──────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Allowed: JPEG, PNG, WebP, PDF.', 400), false);
  }
};

// ─── Multer Instance ──────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
});

/**
 * uploadReceipt — Single file upload middleware.
 * Attaches file info to req.file after successful upload.
 * Use with: router.post('/upload', protect, uploadReceipt, handler)
 */
const uploadReceipt = upload.single('receipt');

/**
 * handleUploadError — Wraps multer errors into AppError format.
 * Must be placed AFTER uploadReceipt in route chain.
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File too large. Maximum size is 5MB.', 400));
    }
    return next(new AppError(`Upload error: ${err.message}`, 400));
  }
  next(err);
};

module.exports = { uploadReceipt, handleUploadError };
