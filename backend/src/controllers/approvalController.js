const {
  processApproval,
  getPendingExpensesForApprover,
} = require('../services/approvalEngine');
const ApprovalLog = require('../models/ApprovalLog');
const AppError = require('../utils/AppError');

/**
 * Approval Controller
 * Handles: approve, reject, get pending approvals, get approval history
 */

// ─── POST /api/approvals/:expenseId/approve ───────────────────────────────────
/**
 * approveExpense
 * Records an approval decision and advances the workflow.
 */
const approveExpense = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const { expenseId } = req.params;

    const { expense, message } = await processApproval(
      expenseId,
      req.user._id,
      'approved',
      comment
    );

    res.status(200).json({
      success: true,
      message,
      expense,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/approvals/:expenseId/reject ────────────────────────────────────
/**
 * rejectExpense
 * Records a rejection and immediately sets expense status to 'rejected'.
 */
const rejectExpense = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const { expenseId } = req.params;

    if (!comment) {
      throw new AppError('A comment/reason is required when rejecting an expense.', 400);
    }

    const { expense, message } = await processApproval(
      expenseId,
      req.user._id,
      'rejected',
      comment
    );

    res.status(200).json({
      success: true,
      message,
      expense,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/approvals/pending ───────────────────────────────────────────────
/**
 * getPendingApprovals
 * Returns all expenses that the current user needs to act on.
 */
const getPendingApprovals = async (req, res, next) => {
  try {
    const expenses = await getPendingExpensesForApprover(
      req.user._id,
      req.companyId
    );

    res.status(200).json({
      success: true,
      count: expenses.length,
      expenses,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/approvals/:expenseId/history ────────────────────────────────────
/**
 * getApprovalHistory
 * Returns full audit trail for an expense's approval workflow.
 */
const getApprovalHistory = async (req, res, next) => {
  try {
    const logs = await ApprovalLog.find({ expense: req.params.expenseId })
      .populate('approver', 'name email role')
      .sort({ step: 1, timestamp: 1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      history: logs,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/approvals/:expenseId/admin-override ───────────────────────────
/**
 * adminOverride
 * Admin can force-approve or force-reject any pending expense.
 * Bypasses the normal approval workflow.
 */
const adminOverride = async (req, res, next) => {
  try {
    const { action, comment } = req.body;

    if (!['approved', 'rejected'].includes(action)) {
      throw new AppError("Action must be 'approved' or 'rejected'.", 400);
    }

    // Admin overrides use the processApproval engine with their own ID
    // Since admin is not typically in the approvers list, we handle it directly
    const Expense = require('../models/Expense');
    const expense = await Expense.findOne({
      _id: req.params.expenseId,
      company: req.companyId,
    });

    if (!expense) throw new AppError('Expense not found.', 404);
    if (!['pending', 'draft'].includes(expense.status)) {
      throw new AppError(`Cannot override: expense status is '${expense.status}'.`, 400);
    }

    // Save override log
    await ApprovalLog.create({
      expense: expense._id,
      approver: req.user._id,
      company: req.companyId,
      step: expense.currentStep || 1,
      status: action,
      comment: comment || 'Admin override',
      isSpecialApprover: false,
    });

    expense.status = action;
    expense.resolvedAt = new Date();
    await expense.save();

    res.status(200).json({
      success: true,
      message: `Expense ${action} via admin override.`,
      expense,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  approveExpense,
  rejectExpense,
  getPendingApprovals,
  getApprovalHistory,
  adminOverride,
};
