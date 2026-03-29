const mongoose = require('mongoose');

/**
 * ApprovalLog Schema
 * Immutable audit trail — every approval/rejection action is recorded here.
 * Enables full history tracking, percentage calculations, and sequential step checks.
 */
const approvalLogSchema = new mongoose.Schema(
  {
    // ─── References ─────────────────────────────────────────────────────────
    expense: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense',
      required: true,
    },

    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },

    // ─── Workflow Context ────────────────────────────────────────────────────
    // Which step in the approval chain this log belongs to (1-indexed)
    step: {
      type: Number,
      required: true,
      min: 1,
    },

    // ─── Decision ───────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['approved', 'rejected'],
      required: true,
    },

    // Optional comment explaining the decision
    comment: {
      type: String,
      trim: true,
      default: null,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },

    // Whether this was a special approver override
    isSpecialApprover: {
      type: Boolean,
      default: false,
    },

    // Whether this was a manager approval (step 1 auto-routing)
    isManagerApproval: {
      type: Boolean,
      default: false,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // createdAt redundant (timestamp), but updatedAt useful if comments edited
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
approvalLogSchema.index({ expense: 1, step: 1 });
approvalLogSchema.index({ approver: 1, status: 1 });
approvalLogSchema.index({ company: 1, timestamp: -1 });

module.exports = mongoose.model('ApprovalLog', approvalLogSchema);
