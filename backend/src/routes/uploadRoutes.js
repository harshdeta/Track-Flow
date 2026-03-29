const express = require('express');
const router = express.Router();
const { uploadExpenseReceipt, deleteExpenseReceipt } = require('../controllers/uploadController');
const { uploadReceipt, handleUploadError } = require('../middleware/upload');
const { protect } = require('../middleware/auth');

/**
 * Upload Routes
 *
 * POST   /api/upload/receipt/:expenseId  → Upload receipt (multipart/form-data, field: receipt)
 * DELETE /api/upload/receipt/:expenseId  → Remove receipt from expense
 */

router.use(protect);

router
  .route('/receipt/:expenseId')
  .post(uploadReceipt, handleUploadError, uploadExpenseReceipt)
  .delete(deleteExpenseReceipt);

module.exports = router;
