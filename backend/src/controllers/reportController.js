const Expense = require('../models/Expense');
const ApprovalLog = require('../models/ApprovalLog');
const User = require('../models/User');
const Company = require('../models/Company');

/**
 * Reports Controller
 * Dashboard analytics — expense summaries, approval stats, category breakdowns.
 * All data is scoped to the requesting user's company (multi-tenant safe).
 */

// ─── GET /api/reports/summary ─────────────────────────────────────────────────
/**
 * getDashboardSummary
 * Returns high-level KPIs for the admin/manager dashboard.
 *
 * Returns:
 *  - Total expenses by status
 *  - Total amount by status (in base currency)
 *  - Top categories by spend
 *  - Monthly trend (last 6 months)
 *  - Team leaderboard (top submitters)
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const companyId = req.companyId;

    // ── Base filter: all expenses in company ──────────────────────────────
    let expenseFilter = { company: companyId };

    // Managers see only their team's data
    if (req.user.role === 'manager') {
      const teamMembers = await User.find({
        manager: req.user._id,
        company: companyId,
      }).select('_id');
      expenseFilter.user = { $in: [...teamMembers.map((u) => u._id), req.user._id] };
    }

    // ── 1. Status-wise count and amount totals ────────────────────────────
    const statusAgg = await Expense.aggregate([
      { $match: expenseFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$convertedAmount' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const statusSummary = {};
    let totalExpenses = 0;
    let totalAmount = 0;
    statusAgg.forEach((s) => {
      statusSummary[s._id] = {
        count: s.count,
        totalAmount: parseFloat((s.totalAmount || 0).toFixed(2)),
      };
      totalExpenses += s.count;
      totalAmount += s.totalAmount || 0;
    });

    // ── 2. Category breakdown ─────────────────────────────────────────────
    const categoryAgg = await Expense.aggregate([
      { $match: { ...expenseFilter, status: { $in: ['approved', 'pending'] } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$convertedAmount' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // ── 3. Monthly trend (last 6 months) ──────────────────────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyAgg = await Expense.aggregate([
      {
        $match: {
          ...expenseFilter,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year:  { $year:  '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$convertedAmount' },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyTrend = monthlyAgg.map((m) => ({
      month: `${monthNames[m._id.month - 1]} ${m._id.year}`,
      count: m.count,
      totalAmount: parseFloat((m.totalAmount || 0).toFixed(2)),
      approvedCount: m.approvedCount,
    }));

    // ── 4. Top submitters ─────────────────────────────────────────────────
    const topSubmitters = await Expense.aggregate([
      { $match: expenseFilter },
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 },
          totalAmount: { $sum: '$convertedAmount' },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          name: '$user.name',
          email: '$user.email',
          department: '$user.department',
          expenseCount: '$count',
          totalAmount: 1,
        },
      },
    ]);

    // ── 5. Approval turnaround time (avg days from submit to resolve) ─────
    const turnaroundAgg = await Expense.aggregate([
      {
        $match: {
          ...expenseFilter,
          status: { $in: ['approved', 'rejected'] },
          resolvedAt: { $ne: null },
        },
      },
      {
        $project: {
          turnaroundDays: {
            $divide: [
              { $subtract: ['$resolvedAt', '$updatedAt'] },
              1000 * 60 * 60 * 24, // ms → days
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgTurnaroundDays: { $avg: '$turnaroundDays' },
          minDays: { $min: '$turnaroundDays' },
          maxDays: { $max: '$turnaroundDays' },
        },
      },
    ]);

    const turnaround = turnaroundAgg[0]
      ? {
          avgDays: parseFloat((turnaroundAgg[0].avgTurnaroundDays || 0).toFixed(1)),
          minDays: parseFloat((turnaroundAgg[0].minDays || 0).toFixed(1)),
          maxDays: parseFloat((turnaroundAgg[0].maxDays || 0).toFixed(1)),
        }
      : { avgDays: 0, minDays: 0, maxDays: 0 };

    // ── Company info ──────────────────────────────────────────────────────
    const company = req.user.company;

    res.status(200).json({
      success: true,
      report: {
        company: {
          name: company.name,
          baseCurrency: company.baseCurrency,
        },
        overview: {
          totalExpenses,
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          currency: company.baseCurrency,
          byStatus: statusSummary,
        },
        categoryBreakdown: categoryAgg.map((c) => ({
          category: c._id,
          count: c.count,
          totalAmount: parseFloat((c.totalAmount || 0).toFixed(2)),
        })),
        monthlyTrend,
        topSubmitters,
        approvalPerformance: turnaround,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/reports/my-expenses ────────────────────────────────────────────
/**
 * getMyExpenseReport
 * Employee's personal expense summary.
 */
const getMyExpenseReport = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const companyId = req.companyId;

    const [statusAgg, categoryAgg, recentExpenses] = await Promise.all([
      // Status summary
      Expense.aggregate([
        { $match: { user: userId, company: companyId } },
        { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$convertedAmount' } } },
      ]),
      // Category summary
      Expense.aggregate([
        { $match: { user: userId, company: companyId } },
        { $group: { _id: '$category', count: { $sum: 1 }, totalAmount: { $sum: '$convertedAmount' } } },
        { $sort: { totalAmount: -1 } },
      ]),
      // 5 most recent expenses
      Expense.find({ user: userId, company: companyId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('amount currency convertedAmount category status date description'),
    ]);

    const byStatus = {};
    let totalSubmitted = 0;
    let totalApproved = 0;

    statusAgg.forEach((s) => {
      byStatus[s._id] = {
        count: s.count,
        totalAmount: parseFloat((s.totalAmount || 0).toFixed(2)),
      };
      totalSubmitted += s.count;
      if (s._id === 'approved') totalApproved = s.totalAmount || 0;
    });

    res.status(200).json({
      success: true,
      report: {
        user: { name: req.user.name, email: req.user.email },
        summary: {
          totalExpenses: totalSubmitted,
          totalApprovedAmount: parseFloat(totalApproved.toFixed(2)),
          currency: req.user.company.baseCurrency,
          byStatus,
        },
        byCategory: categoryAgg.map((c) => ({
          category: c._id,
          count: c.count,
          totalAmount: parseFloat((c.totalAmount || 0).toFixed(2)),
        })),
        recentExpenses,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/reports/approvals ───────────────────────────────────────────────
/**
 * getApprovalReport
 * Approval team stats — how many approved/rejected by each approver.
 */
const getApprovalReport = async (req, res, next) => {
  try {
    const companyId = req.companyId;

    const approverStats = await ApprovalLog.aggregate([
      { $match: { company: companyId } },
      {
        $group: {
          _id: { approver: '$approver', status: '$status' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.approver',
          decisions: {
            $push: { status: '$_id.status', count: '$count' },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'approver',
        },
      },
      { $unwind: '$approver' },
      {
        $project: {
          _id: 0,
          name: '$approver.name',
          email: '$approver.email',
          role: '$approver.role',
          decisions: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);

    // Normalize to { name, approved, rejected, total }
    const normalized = approverStats.map((a) => {
      const approved = a.decisions.find((d) => d.status === 'approved')?.count || 0;
      const rejected = a.decisions.find((d) => d.status === 'rejected')?.count || 0;
      return {
        name: a.name,
        email: a.email,
        role: a.role,
        approved,
        rejected,
        total: approved + rejected,
        approvalRate: approved + rejected > 0
          ? `${Math.round((approved / (approved + rejected)) * 100)}%`
          : 'N/A',
      };
    });

    res.status(200).json({
      success: true,
      count: normalized.length,
      approvalStats: normalized,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardSummary, getMyExpenseReport, getApprovalReport };
