const Expense = require('../models/Expense');
const ApprovalRule = require('../models/ApprovalRule');
const ApprovalLog = require('../models/ApprovalLog');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * ════════════════════════════════════════════════════════════════════════════
 * APPROVAL ENGINE — Core Business Logic
 * ════════════════════════════════════════════════════════════════════════════
 *
 * This service handles:
 *  1. findApplicableRule  — matches an expense to the correct ApprovalRule
 *  2. buildApproverList   — resolves the actual approvers (incl. manager injection)
 *  3. submitForApproval   — transitions expense from draft → pending
 *  4. processApproval     — core: records a decision and resolves the workflow
 *
 * ── Sequential Flow ─────────────────────────────────────────────────────────
 * Step 1 → approved → notify Step 2 → ... → approved → expense APPROVED
 * Any step rejected → expense REJECTED immediately
 *
 * ── Parallel Flow ───────────────────────────────────────────────────────────
 * All approvers notified simultaneously.
 * When approvedCount / totalApprovers >= minApprovalPercent → APPROVED
 * Any rejection → REJECTED immediately (fail fast)
 *
 * ── Special Approver Override ────────────────────────────────────────────────
 * If the approver is the configured specialApprover, the expense is auto-approved
 * regardless of other pending approvals.
 *
 * ════════════════════════════════════════════════════════════════════════════
 */

// ─── 1. FIND APPLICABLE RULE ─────────────────────────────────────────────────

/**
 * findApplicableRule
 * Selects the most specific ApprovalRule for a given expense.
 *
 * Priority order:
 *   1. Category-specific rule (with amount threshold met)
 *   2. Category-specific rule (no threshold)
 *   3. Default rule (category = null)
 *
 * @param {string} companyId
 * @param {string} category
 * @param {number} amount - Amount in company base currency
 * @returns {ApprovalRule | null}
 */
const findApplicableRule = async (companyId, category, amount) => {
  // Fetch all active rules for this company, sorted by priority (desc)
  const rules = await ApprovalRule.find({
    company: companyId,
    isActive: true,
  }).sort({ priority: -1 });

  // Phase 1: Look for category + amount threshold match
  let matched = rules.find(
    (r) =>
      r.category === category &&
      amount >= (r.amountThreshold || 0)
  );

  // Phase 2: Category match without amount restriction
  if (!matched) {
    matched = rules.find((r) => r.category === category);
  }

  // Phase 3: Default/catch-all rule (category = null)
  if (!matched) {
    matched = rules.find((r) => r.category === null || r.category === undefined);
  }

  return matched || null;
};

// ─── 2. BUILD APPROVER LIST ──────────────────────────────────────────────────

/**
 * buildApproverList
 * Resolves the full list of approver IDs for an expense.
 * Injects manager as step-1 if isManagerApprover is configured.
 *
 * @param {ApprovalRule} rule
 * @param {User} employee - The expense submitter
 * @returns {ObjectId[]} - Ordered list of approver user IDs
 */
const buildApproverList = async (rule, employee) => {
  // Normalize: extract ObjectId from populated docs if needed
  let approvers = (rule.approvers || []).map((a) => a._id ?? a);

  if (rule.isManagerApprover && employee.manager) {
    // Inject manager at the front of the approver list (step 1)
    const managerId = employee.manager._id ?? employee.manager;
    // Avoid adding manager twice if already in the list
    const alreadyInList = approvers.some(
      (a) => (a._id ?? a).toString() === managerId.toString()
    );
    if (!alreadyInList) {
      approvers.unshift(managerId);
    }
  }

  return approvers;
};

// ─── 3. SUBMIT FOR APPROVAL ──────────────────────────────────────────────────

/**
 * submitForApproval
 * Transitions an expense from 'draft' to 'pending'.
 * Finds the applicable rule and attaches it to the expense.
 *
 * @param {string} expenseId
 * @param {string} submitterId - User submitting (must be the expense owner)
 * @returns {Expense}
 */
const submitForApproval = async (expenseId, submitterId) => {
  const expense = await Expense.findById(expenseId).populate('user');
  if (!expense) throw new AppError('Expense not found', 404);

  if (expense.user._id.toString() !== submitterId.toString()) {
    throw new AppError('You can only submit your own expenses', 403);
  }

  if (expense.status !== 'draft') {
    throw new AppError(
      `Expense cannot be submitted. Current status: ${expense.status}`,
      400
    );
  }

  // Find the applicable rule
  const rule = await findApplicableRule(
    expense.company,
    expense.category,
    expense.convertedAmount ?? expense.amount
  );

  if (!rule) {
    throw new AppError(
      'No approval rule found for this expense. Please ask your admin to configure one.',
      400
    );
  }

  // Attach rule and transition to pending
  expense.approvalRule = rule._id;
  expense.status = 'pending';
  expense.currentStep = 1; // Start at step 1

  await expense.save();

  return expense;
};

// ─── 4. PROCESS APPROVAL (CORE ENGINE) ──────────────────────────────────────

/**
 * processApproval
 * ─────────────────────────────────────────────────────────────────────────────
 * Records an approver's decision and determines the next state of the expense.
 *
 * Decision tree:
 *   [REJECTED] → expense.status = 'rejected', stop
 *   [APPROVED by specialApprover] → expense.status = 'approved', stop
 *   [APPROVED, parallel flow]:
 *     → count approvals; if % >= minApprovalPercent → approved
 *     → else wait for more
 *   [APPROVED, sequential flow]:
 *     → if more steps remain → increment currentStep → wait for next approver
 *     → else → approved
 *
 * @param {string} expenseId
 * @param {string} approverId - ID of the user taking the action
 * @param {'approved' | 'rejected'} action
 * @param {string} comment - Optional comment
 * @returns {{ expense: Expense, message: string }}
 */
const processApproval = async (expenseId, approverId, action, comment = '') => {
  // ── Load expense with related data ────────────────────────────────────────
  const expense = await Expense.findById(expenseId).populate({
    path: 'user',
    select: 'name email manager company',
    populate: { path: 'manager', select: '_id name email' },
  });

  if (!expense) throw new AppError('Expense not found', 404);
  if (expense.status !== 'pending') {
    throw new AppError(
      `Cannot process: expense is already '${expense.status}'`,
      400
    );
  }

  // ── Load the applicable approval rule ────────────────────────────────────
  const rule = await ApprovalRule.findById(expense.approvalRule).populate(
    'specialApprover approvers'
  );

  if (!rule) {
    throw new AppError(
      'Approval rule not found. The rule may have been deleted.',
      404
    );
  }

  // ── Build the full approver list (with manager injection) ─────────────────
  const approverIds = await buildApproverList(rule, expense.user);

  // ── Validate that approverId is allowed to act on this expense ───────────
  // When rule.approvers is populated, each item is a full User doc — extract ._id
  const isSpecialApprover =
    rule.specialApprover &&
    (rule.specialApprover._id ?? rule.specialApprover).toString() === approverId.toString();

  const isInApproverList = approverIds.some(
    (id) => (id._id ?? id).toString() === approverId.toString()
  );

  if (!isSpecialApprover && !isInApproverList) {
    throw new AppError(
      'You are not authorized to approve this expense.',
      403
    );
  }

  // ── Sequential flow: ensure it's this approver's turn ────────────────────
  if (!isSpecialApprover && rule.flowType === 'sequential') {
    const currentApproverRaw = approverIds[expense.currentStep - 1];
    const currentApproverId = currentApproverRaw ? (currentApproverRaw._id ?? currentApproverRaw).toString() : null;
    if (!currentApproverId || currentApproverId !== approverId.toString()) {
      throw new AppError(
        'It is not your turn to approve this expense.',
        403
      );
    }
  }

  // ── Check for duplicate approval (prevent double-voting) ─────────────────
  const existingLog = await ApprovalLog.findOne({
    expense: expenseId,
    approver: approverId,
    step: expense.currentStep,
  });

  if (existingLog) {
    throw new AppError('You have already acted on this expense for this step.', 409);
  }

  // ── Determine manager approval flag ──────────────────────────────────────
  const isManagerApproval =
    rule.isManagerApprover &&
    expense.user.manager &&
    expense.user.manager._id.toString() === approverId.toString() &&
    expense.currentStep === 1;

  // ── Save the approval log ─────────────────────────────────────────────────
  await ApprovalLog.create({
    expense: expenseId,
    approver: approverId,
    company: expense.company,
    step: expense.currentStep,
    status: action,
    comment,
    isSpecialApprover,
    isManagerApproval,
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ── DECISION LOGIC ───────────────────────────────────────────────────────
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  let message = '';

  // ── Case 1: REJECTION → always immediately rejects the expense ────────────
  if (action === 'rejected') {
    expense.status = 'rejected';
    expense.resolvedAt = new Date();
    await expense.save();
    return { expense, message: 'Expense has been rejected.' };
  }

  // From here: action === 'approved'

  // ── Case 2: SPECIAL APPROVER → override, auto-approve ─────────────────────
  if (isSpecialApprover) {
    expense.status = 'approved';
    expense.resolvedAt = new Date();
    await expense.save();
    return {
      expense,
      message: 'Expense approved via special approver override.',
    };
  }

  // ── Case 3: PARALLEL FLOW ─────────────────────────────────────────────────
  if (rule.flowType === 'parallel') {
    // Count all approvals for this expense (across all steps/approvers)
    const totalApprovals = await ApprovalLog.countDocuments({
      expense: expenseId,
      status: 'approved',
    });

    const totalApprovers = approverIds.length;
    const approvalPercent = (totalApprovals / totalApprovers) * 100;

    if (approvalPercent >= rule.minApprovalPercent) {
      // Enough votes — approve!
      expense.status = 'approved';
      expense.resolvedAt = new Date();
      await expense.save();
      message = `Expense approved. ${totalApprovals}/${totalApprovers} approvers approved (${approvalPercent.toFixed(0)}% ≥ ${rule.minApprovalPercent}% required).`;
    } else {
      // Not enough votes yet — keep pending
      message = `Approval recorded. ${totalApprovals}/${totalApprovers} approvers have approved so far (${approvalPercent.toFixed(0)}%). Need ${rule.minApprovalPercent}% to approve.`;
    }

    await expense.save();
    return { expense, message };
  }

  // ── Case 4: SEQUENTIAL FLOW ───────────────────────────────────────────────
  if (rule.flowType === 'sequential') {
    const nextStep = expense.currentStep + 1;

    if (nextStep > approverIds.length) {
      // All steps completed → approve!
      expense.status = 'approved';
      expense.resolvedAt = new Date();
      expense.currentStep = approverIds.length;
      await expense.save();
      message = 'All approval steps completed. Expense is approved.';
    } else {
      // Move to next step — next approver's turn
      expense.currentStep = nextStep;
      await expense.save();
      const nextApproverId = approverIds[nextStep - 1];
      message = `Step ${expense.currentStep - 1} approved. Moved to step ${nextStep}. Awaiting approver.`;
      // In a real system: emit event / send notification to nextApproverId
    }

    return { expense, message };
  }

  // Fallback (should never reach here)
  throw new AppError('Unknown flow type in approval rule.', 500);
};

// ─── 5. GET PENDING APPROVALS FOR AN APPROVER ────────────────────────────────

/**
 * getPendingExpensesForApprover
 * Returns expenses where the given user is authorized to vote and hasn't yet.
 *
 * @param {string} approverId
 * @param {string} companyId
 * @returns {Expense[]}
 */
const getPendingExpensesForApprover = async (approverId, companyId) => {
  // Fetch all pending expenses for this company
  const pendingExpenses = await Expense.find({
    company: companyId,
    status: 'pending',
  })
    .populate({
      path: 'user',
      select: 'name email manager department',
      populate: { path: 'manager', select: '_id' },
    })
    .populate('approvalRule')
    .sort({ createdAt: 1 });

  const result = [];

  for (const expense of pendingExpenses) {
    const rule = expense.approvalRule;
    if (!rule) continue;

    const approverIds = await buildApproverList(rule, expense.user);

    let canAct = false;

    // Check if special approver
    if (
      rule.specialApprover &&
      rule.specialApprover.toString() === approverId.toString()
    ) {
      canAct = true;
    }

    // Check if in the approver list
    const isInList = approverIds.some(
      (id) => id.toString() === approverId.toString()
    );

    if (isInList) {
      if (rule.flowType === 'sequential') {
        // Can only act if it's your step
        const currentApproverId = approverIds[expense.currentStep - 1];
        if (
          currentApproverId &&
          currentApproverId.toString() === approverId.toString()
        ) {
          canAct = true;
        }
      } else {
        // Parallel: can always act if you haven't voted yet
        canAct = true;
      }
    }

    if (!canAct) continue;

    // Check if already voted
    const alreadyVoted = await ApprovalLog.findOne({
      expense: expense._id,
      approver: approverId,
    });

    if (!alreadyVoted) {
      result.push(expense);
    }
  }

  return result;
};

module.exports = {
  findApplicableRule,
  buildApproverList,
  submitForApproval,
  processApproval,
  getPendingExpensesForApprover,
};
