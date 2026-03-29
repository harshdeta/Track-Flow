const mongoose = require('mongoose');

/**
 * Expense Schema
 * Core entity — represents a single reimbursable expense submitted by an employee.
 * Each expense is tied to a company (tenant), has a currency, and tracks approval status.
 */
const expenseSchema = new mongoose.Schema(
  {
    // ─── Ownership ─────────────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Expense must belong to a user'],
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Expense must belong to a company'],
    },

    // ─── Financials ─────────────────────────────────────────────────────────
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },

    currency: {
      type: String,
      required: [true, 'Currency is required'],
      uppercase: true,
      trim: true,
      // ISO 4217 e.g. USD, EUR, INR
    },

    // Converted to company's base currency for reporting
    convertedAmount: {
      type: Number,
      default: null,
    },

    conversionRate: {
      type: Number,
      default: null, // Exchange rate at time of submission
    },

    // ─── Expense Details ────────────────────────────────────────────────────
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'travel',
        'accommodation',
        'meals',
        'office_supplies',
        'software',
        'hardware',
        'training',
        'medical',
        'other',
      ],
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    date: {
      type: Date,
      required: [true, 'Expense date is required'],
    },

    paidBy: {
      type: String,
      enum: ['employee', 'company_card'],
      default: 'employee',
    },

    // ─── Supporting Documents ───────────────────────────────────────────────
    receiptUrl: {
      type: String,
      default: null,
      // URL to uploaded receipt image/PDF
    },

    // OCR-parsed data from receipt (bonus feature)
    ocrData: {
      vendor: { type: String, default: null },
      ocrAmount: { type: Number, default: null },
      ocrDate: { type: String, default: null },
      rawText: { type: String, default: null },
    },

    // ─── Admin/Manager Notes ────────────────────────────────────────────────
    remarks: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Approval Workflow ──────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'cancelled'],
      default: 'draft',
    },

    // Tracks which step the expense is currently at in sequential approval flow
    currentStep: {
      type: Number,
      default: 0,
      // step 0 = not started, step 1 = first approver, etc.
    },

    // Reference to the approval rule that governs this expense
    approvalRule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApprovalRule',
      default: null,
    },

    // Timestamp when expense was fully approved/rejected
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
expenseSchema.index({ company: 1, status: 1 });
expenseSchema.index({ user: 1, status: 1 });
expenseSchema.index({ company: 1, category: 1 });
expenseSchema.index({ date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
