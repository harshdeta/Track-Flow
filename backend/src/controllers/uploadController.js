const path = require('path');
const Expense = require('../models/Expense');
const AppError = require('../utils/AppError');

/**
 * Upload Controller
 * Handles receipt file uploads and attaches them to expenses.
 */

// ─── POST /api/upload/receipt/:expenseId ──────────────────────────────────────
/**
 * uploadExpenseReceipt
 * Accepts a multipart/form-data file (field name: "receipt")
 * and attaches the URL to the specified expense.
 *
 * The expense must belong to the requesting user (or admin).
 */
const uploadExpenseReceipt = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded. Include a file in the "receipt" field.', 400);
    }

    const expense = await Expense.findOne({
      _id: req.params.expenseId,
      company: req.companyId,
    });

    if (!expense) throw new AppError('Expense not found.', 404);

    // Only owner or admin can attach receipt
    if (
      req.user.role !== 'admin' &&
      expense.user.toString() !== req.user._id.toString()
    ) {
      throw new AppError('Access denied. You can only upload receipts for your own expenses.', 403);
    }

    // Build accessible URL
    // In development: serve via /uploads/receipts/<filename>
    // In production: replace with S3 URL from multer-s3
    const receiptUrl = `/uploads/receipts/${req.file.filename}`;

    expense.receiptUrl = receiptUrl;
    await expense.save();

    res.status(200).json({
      success: true,
      message: 'Receipt uploaded and attached to expense.',
      receiptUrl,
      filename: req.file.filename,
      size: `${(req.file.size / 1024).toFixed(1)} KB`,
      expense: expense._id,
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/upload/receipt/:expenseId ────────────────────────────────────
/**
 * deleteExpenseReceipt
 * Removes the receipt URL from the expense (does not delete the file from disk).
 */
const deleteExpenseReceipt = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.expenseId,
      company: req.companyId,
    });

    if (!expense) throw new AppError('Expense not found.', 404);

    if (
      req.user.role !== 'admin' &&
      expense.user.toString() !== req.user._id.toString()
    ) {
      throw new AppError('Access denied.', 403);
    }

    expense.receiptUrl = null;
    await expense.save();

    res.status(200).json({ success: true, message: 'Receipt removed from expense.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadExpenseReceipt, deleteExpenseReceipt };
