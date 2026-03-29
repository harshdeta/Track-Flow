const mongoose = require('mongoose');

/**
 * ApprovalRule Schema
 * Admin configures per-company rules that determine how expenses are approved.
 *
 * Key concepts:
 * - category: which expense category this rule applies to (null = catch-all)
 * - approvers: ordered list of approver user IDs (for sequential flow)
 * - flowType: 'sequential' (one at a time) or 'parallel' (all at once)
 * - minApprovalPercent: for parallel flow, % of approvers needed
 * - specialApprover: user who can override and auto-approve (e.g., CFO)
 * - isManagerApprover: if true, employee's manager is automatically step 1
 * - amountThreshold: rule applies only above this amount (optional)
 */
const approvalRuleSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },

    name: {
      type: String,
      required: [true, 'Rule name is required'],
      trim: true,
    },

    // Expense category this rule applies to — null means it's the default/catch-all
    category: {
      type: String,
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
        null,
      ],
      default: null,
    },

    // Optional: rule only triggers if expense amount >= this value
    amountThreshold: {
      type: Number,
      default: 0,
    },

    // Ordered list of approvers (User IDs) — order matters for sequential flow
    approvers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // 'sequential': each approver must approve before next is notified
    // 'parallel': all approvers are notified simultaneously
    flowType: {
      type: String,
      enum: ['sequential', 'parallel'],
      default: 'sequential',
    },

    // For parallel flow: what % of approvers must approve to pass
    // e.g., 60 means 60% of approvers need to approve
    minApprovalPercent: {
      type: Number,
      default: 100, // By default, all approvers must approve
      min: 1,
      max: 100,
    },

    // A special approver (e.g., CFO) whose single approval auto-approves the expense
    specialApprover: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // If true, employee's assigned manager is automatically inserted as step 1 approver
    isManagerApprover: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Priority: higher priority rules are matched first when multiple rules can apply
    priority: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
approvalRuleSchema.index({ company: 1, category: 1, isActive: 1 });
approvalRuleSchema.index({ company: 1, priority: -1 });

module.exports = mongoose.model('ApprovalRule', approvalRuleSchema);
