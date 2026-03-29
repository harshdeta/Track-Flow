const ApprovalRule = require('../models/ApprovalRule');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Approval Rule Controller
 * Admin configures the approval workflow rules per company.
 */

// ─── POST /api/approval-rules ─────────────────────────────────────────────────
/**
 * createRule
 * Admin creates a new approval rule for their company.
 */
const createRule = async (req, res, next) => {
  try {
    const {
      name,
      category,
      amountThreshold,
      approvers,
      flowType,
      minApprovalPercent,
      specialApproverId,
      isManagerApprover,
      priority,
    } = req.body;

    if (!name) throw new AppError('Rule name is required.', 400);

    // Validate approver IDs belong to this company
    if (approvers && approvers.length > 0) {
      const validApprovers = await User.countDocuments({
        _id: { $in: approvers },
        company: req.companyId,
        isActive: true,
      });

      if (validApprovers !== approvers.length) {
        throw new AppError(
          'One or more approvers are invalid or do not belong to this company.',
          400
        );
      }
    }

    // Validate special approver
    if (specialApproverId) {
      const specialApprover = await User.findOne({
        _id: specialApproverId,
        company: req.companyId,
        isActive: true,
      });

      if (!specialApprover) {
        throw new AppError('Special approver not found in this company.', 404);
      }
    }

    const rule = await ApprovalRule.create({
      company: req.companyId,
      name,
      category: category || null,
      amountThreshold: amountThreshold || 0,
      approvers: approvers || [],
      flowType: flowType || 'sequential',
      minApprovalPercent: minApprovalPercent || 100,
      specialApprover: specialApproverId || null,
      isManagerApprover: isManagerApprover || false,
      priority: priority || 0,
    });

    const populated = await ApprovalRule.findById(rule._id)
      .populate('approvers', 'name email role')
      .populate('specialApprover', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Approval rule created.',
      rule: populated,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/approval-rules ──────────────────────────────────────────────────
/**
 * getAllRules
 * Admin fetches all rules for their company.
 */
const getAllRules = async (req, res, next) => {
  try {
    const rules = await ApprovalRule.find({ company: req.companyId })
      .populate('approvers', 'name email role')
      .populate('specialApprover', 'name email role')
      .sort({ priority: -1, createdAt: -1 });

    res.status(200).json({ success: true, count: rules.length, rules });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/approval-rules/:id ─────────────────────────────────────────────
/**
 * getRuleById
 */
const getRuleById = async (req, res, next) => {
  try {
    const rule = await ApprovalRule.findOne({
      _id: req.params.id,
      company: req.companyId,
    })
      .populate('approvers', 'name email role')
      .populate('specialApprover', 'name email role');

    if (!rule) throw new AppError('Approval rule not found.', 404);

    res.status(200).json({ success: true, rule });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/approval-rules/:id ───────────────────────────────────────────
/**
 * updateRule
 */
const updateRule = async (req, res, next) => {
  try {
    const rule = await ApprovalRule.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!rule) throw new AppError('Approval rule not found.', 404);

    const updatableFields = [
      'name', 'category', 'amountThreshold', 'approvers',
      'flowType', 'minApprovalPercent', 'isManagerApprover', 'isActive', 'priority',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) rule[field] = req.body[field];
    });

    if (req.body.specialApproverId !== undefined) {
      rule.specialApprover = req.body.specialApproverId || null;
    }

    await rule.save();

    const updated = await ApprovalRule.findById(rule._id)
      .populate('approvers', 'name email role')
      .populate('specialApprover', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Approval rule updated.',
      rule: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/approval-rules/:id ──────────────────────────────────────────
/**
 * deleteRule
 * Soft delete: deactivates the rule instead of removing it.
 */
const deleteRule = async (req, res, next) => {
  try {
    const rule = await ApprovalRule.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!rule) throw new AppError('Approval rule not found.', 404);

    rule.isActive = false;
    await rule.save();

    res.status(200).json({
      success: true,
      message: 'Approval rule deactivated.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRule,
  getAllRules,
  getRuleById,
  updateRule,
  deleteRule,
};
