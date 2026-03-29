const mongoose = require('mongoose');

/**
 * Company Schema
 * Root tenant entity — every user, expense, and rule belongs to a company.
 * Supports multi-tenancy by scoping all queries to companyId.
 */
const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Company country is required'],
      trim: true,
    },
    baseCurrency: {
      type: String,
      required: [true, 'Base currency is required'],
      uppercase: true,
      trim: true,
      default: 'USD',
      // ISO 4217 currency code e.g. USD, EUR, INR, GBP
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      // Optional company-level settings
      requireReceiptAbove: { type: Number, default: 0 }, // Require receipt if expense > this amount
      maxExpenseAmount: { type: Number, default: null },  // Optional cap on single expense
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model('Company', companySchema);
