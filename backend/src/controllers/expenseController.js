const Expense = require('../models/Expense');
const ApprovalLog = require('../models/ApprovalLog');
const AppError = require('../utils/AppError');
const { convertAmount } = require('../services/currencyService');
const { submitForApproval: submitForApprovalEngine } = require('../services/approvalEngine');

/**
 * Expense Controller
 * Handles: create, read, submit-for-approval, cancel
 * Filter logic is role-aware: employee → own, manager → team, admin → all
 */

// ─── POST /api/expenses ───────────────────────────────────────────────────────
/**
 * createExpense
 * Employee creates a new expense in 'draft' state.
 * Currency conversion happens automatically.
 */
const createExpense = async (req, res, next) => {
  try {
    const {
      amount,
      currency,
      category,
      description,
      date,
      paidBy,
      receiptUrl,
      remarks,
      submitImmediately, // Boolean: if true, auto-submit for approval
    } = req.body;

    if (!amount || !currency || !category || !description || !date) {
      throw new AppError(
        'amount, currency, category, description, and date are required.',
        400
      );
    }

    // ── Currency conversion ───────────────────────────────────────────────
    const company = req.user.company;
    const baseCurrency = company.baseCurrency || 'USD';

    let convertedAmount = amount;
    let conversionRate = 1;

    if (currency.toUpperCase() !== baseCurrency.toUpperCase()) {
      const conversion = await convertAmount(amount, currency, baseCurrency);
      convertedAmount = conversion.convertedAmount;
      conversionRate = conversion.rate;
    }

    // ── Create the expense ────────────────────────────────────────────────
    const expense = await Expense.create({
      user: req.user._id,
      company: req.companyId,
      amount,
      currency: currency.toUpperCase(),
      convertedAmount,
      conversionRate,
      category,
      description,
      date: new Date(date),
      paidBy: paidBy || 'employee',
      receiptUrl: receiptUrl || null,
      remarks: remarks || null,
      status: 'draft',
    });

    // ── Optionally submit immediately ─────────────────────────────────────
    if (submitImmediately) {
      await submitForApprovalEngine(expense._id, req.user._id);
    }

    const populated = await Expense.findById(expense._id).populate(
      'user',
      'name email'
    );

    res.status(201).json({
      success: true,
      message: submitImmediately
        ? 'Expense created and submitted for approval.'
        : 'Expense created as draft.',
      expense: populated,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/expenses/:id/submit ───────────────────────────────────────────
/**
 * submitExpense
 * Transitions a draft expense to 'pending' (submits for approval).
 */
const submitExpense = async (req, res, next) => {
  try {
    const expense = await submitForApprovalEngine(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Expense submitted for approval.',
      expense,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/expenses ────────────────────────────────────────────────────────
/**
 * getExpenses
 * Role-based filtering:
 *   employee → only own expenses
 *   manager  → own + direct reports' expenses
 *   admin    → all expenses in company
 */
const getExpenses = async (req, res, next) => {
  try {
    const {
      status,
      category,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      userId,
    } = req.query;

    // ── Build base filter ─────────────────────────────────────────────────
    let filter = { company: req.companyId };

    if (req.user.role === 'employee') {
      // Employee: only their own expenses
      filter.user = req.user._id;
    } else if (req.user.role === 'manager') {
      // Manager: their own + direct reports' expenses
      const User = require('../models/User');
      const teamMembers = await User.find({
        manager: req.user._id,
        company: req.companyId,
      }).select('_id');
      const teamIds = teamMembers.map((u) => u._id);
      teamIds.push(req.user._id); // Include manager's own expenses

      filter.user = { $in: teamIds };

      // Admin override: if admin passes userId, filter by that
      if (userId) filter.user = userId;
    } else if (req.user.role === 'admin') {
      // Admin: all expenses in company
      if (userId) filter.user = userId;
    }

    // ── Optional filters ──────────────────────────────────────────────────
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // ── Pagination ────────────────────────────────────────────────────────
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .populate('user', 'name email department')
        .populate('approvalRule', 'name flowType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Expense.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      expenses,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/expenses/:id ────────────────────────────────────────────────────
/**
 * getExpenseById
 * Returns full expense detail with approval logs.
 */
const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      company: req.companyId,
    })
      .populate('user', 'name email department')
      .populate('approvalRule')
      .populate('company', 'name baseCurrency');

    if (!expense) throw new AppError('Expense not found.', 404);

    // Employees can only view their own expenses
    if (
      req.user.role === 'employee' &&
      expense.user._id.toString() !== req.user._id.toString()
    ) {
      throw new AppError('Access denied.', 403);
    }

    // Fetch approval history for this expense
    const approvalLogs = await ApprovalLog.find({ expense: expense._id })
      .populate('approver', 'name email role')
      .sort({ step: 1, timestamp: 1 });

    res.status(200).json({
      success: true,
      expense,
      approvalHistory: approvalLogs,
    });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/expenses/:id ──────────────────────────────────────────────────
/**
 * updateExpense
 * Employee can only update a draft expense.
 * Admin can update any expense (e.g., add remarks).
 */
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!expense) throw new AppError('Expense not found.', 404);

    // Employees can only update their own draft expenses
    if (req.user.role === 'employee') {
      if (expense.user.toString() !== req.user._id.toString()) {
        throw new AppError('Access denied.', 403);
      }
      if (expense.status !== 'draft') {
        throw new AppError('Only draft expenses can be edited.', 400);
      }
    }

    const updatableFields = [
      'amount', 'currency', 'category', 'description',
      'date', 'paidBy', 'receiptUrl', 'remarks',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        expense[field] = req.body[field];
      }
    });

    // Re-convert if amount or currency changed
    if (req.body.amount || req.body.currency) {
      const baseCurrency = req.user.company.baseCurrency || 'USD';
      const currency = expense.currency;

      if (currency !== baseCurrency) {
        const { convertedAmount, rate } = await convertAmount(
          expense.amount,
          currency,
          baseCurrency
        );
        expense.convertedAmount = convertedAmount;
        expense.conversionRate = rate;
      } else {
        expense.convertedAmount = expense.amount;
        expense.conversionRate = 1;
      }
    }

    await expense.save();

    res.status(200).json({
      success: true,
      message: 'Expense updated.',
      expense,
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/expenses/:id ─────────────────────────────────────────────────
/**
 * cancelExpense
 * Employee can cancel their own draft expense.
 * Admin can cancel any pending expense.
 */
const cancelExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!expense) throw new AppError('Expense not found.', 404);

    if (req.user.role === 'employee') {
      if (expense.user.toString() !== req.user._id.toString()) {
        throw new AppError('Access denied.', 403);
      }
      if (!['draft', 'pending'].includes(expense.status)) {
        throw new AppError('Cannot cancel an approved or already cancelled expense.', 400);
      }
    }

    expense.status = 'cancelled';
    await expense.save();

    res.status(200).json({ success: true, message: 'Expense cancelled.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  submitExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  cancelExpense,
};
