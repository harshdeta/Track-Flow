// ─── Dummy Users ──────────────────────────────────────────────────────────────
export const dummyUsers = [
  { id: '1', name: 'Sarah Manager', email: 'sarah@acme.com', role: 'manager', manager: '—', status: 'Active', department: 'Engineering' },
  { id: '2', name: 'Bob Employee',  email: 'bob@acme.com',   role: 'employee', manager: 'Sarah Manager', status: 'Active', department: 'Engineering' },
  { id: '3', name: 'Alice Doe',     email: 'alice@acme.com', role: 'employee', manager: 'Sarah Manager', status: 'Active', department: 'Finance' },
  { id: '4', name: 'John Inactive', email: 'john@acme.com',  role: 'employee', manager: 'Sarah Manager', status: 'Inactive', department: 'HR' },
];

// ─── Dummy Expenses ───────────────────────────────────────────────────────────
export const dummyExpenses = [
  { id: 'e1', description: 'Flight to Mumbai', category: 'Travel', date: '2025-03-15', amount: 5000, currency: 'INR', status: 'Approved',  employee: 'Bob Employee', paidBy: 'Employee', remarks: 'Client meeting' },
  { id: 'e2', description: 'Team Lunch',        category: 'Meals',  date: '2025-03-18', amount: 1200, currency: 'INR', status: 'Pending',   employee: 'Bob Employee', paidBy: 'Employee', remarks: '' },
  { id: 'e3', description: 'AWS Subscription',  category: 'Software', date: '2025-03-20', amount: 8000, currency: 'INR', status: 'Pending', employee: 'Alice Doe',   paidBy: 'Company Card', remarks: 'Annual renewal' },
  { id: 'e4', description: 'Hotel Stay Delhi',  category: 'Accommodation', date: '2025-03-10', amount: 3500, currency: 'INR', status: 'Rejected', employee: 'Bob Employee', paidBy: 'Employee', remarks: 'Missing receipt' },
  { id: 'e5', description: 'Postman Pro',       category: 'Software', date: '2025-03-22', amount: 2000, currency: 'INR', status: 'Draft',   employee: 'Alice Doe',   paidBy: 'Employee', remarks: '' },
];

// ─── Dummy Approval Rules ─────────────────────────────────────────────────────
export const dummyRules = [
  { id: 'r1', name: 'Travel - Sequential', category: 'Travel', flowType: 'Sequential', approvers: ['Sarah Manager'], minPercent: 100, special: '—', managerFirst: true, active: true },
  { id: 'r2', name: 'Software - 60%',      category: 'Software', flowType: 'Parallel', approvers: ['Sarah Manager'], minPercent: 60,  special: '—', managerFirst: false, active: true },
  { id: 'r3', name: 'Default Rule',        category: 'All',    flowType: 'Sequential', approvers: ['Sarah Manager'], minPercent: 100, special: 'John Admin', managerFirst: false, active: true },
];

// ─── Dummy Approval Logs ──────────────────────────────────────────────────────
export const dummyApprovalHistory = [
  { step: 1, approver: 'Sarah Manager', role: 'Manager', status: 'Approved', comment: 'Looks good!', date: '2025-03-16' },
  { step: 2, approver: 'John Admin',    role: 'Admin',   status: 'Approved', comment: 'Fast-tracked', date: '2025-03-16' },
];

// ─── Pending Approvals for Manager ────────────────────────────────────────────
export const dummyPendingApprovals = [
  { id: 'e2', employee: 'Bob Employee', category: 'Meals',       description: 'Team Lunch',       amount: 1200, currency: 'INR', status: 'Pending', date: '2025-03-18' },
  { id: 'e3', employee: 'Alice Doe',    category: 'Software',    description: 'AWS Subscription', amount: 8000, currency: 'INR', status: 'Pending', date: '2025-03-20' },
];

// ─── Summary Stats ────────────────────────────────────────────────────────────
export const dummySummary = {
  total: 5, totalAmount: 19700,
  pending: 2, pendingAmount: 9200,
  approved: 1, approvedAmount: 5000,
  rejected: 1, rejectedAmount: 3500,
  draft: 1,
};

export const categories = ['Travel', 'Meals', 'Accommodation', 'Software', 'Hardware', 'Office Supplies', 'Training', 'Medical', 'Other'];
export const currencies  = ['INR', 'USD', 'EUR', 'GBP', 'AED'];
export const countries   = ['India', 'United States', 'United Kingdom', 'UAE', 'Singapore', 'Australia', 'Germany', 'France'];
