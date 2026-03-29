/**
 * TrackFlow — Database Seed Script
 * Creates a demo company with 4 users + approval rules + sample expenses.
 *
 * Usage:
 *   node src/scripts/seed.js
 *
 * ⚠️  Safe to re-run — checks if company already exists before seeding.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

// ─── Import Models ────────────────────────────────────────────────────────────
const Company      = require('../models/Company');
const User         = require('../models/User');
const ApprovalRule = require('../models/ApprovalRule');
const Expense      = require('../models/Expense');

// ─── Seed Data ────────────────────────────────────────────────────────────────
const COMPANY = {
  name:         'TrackFlow Demo Co.',
  country:      'India',
  baseCurrency: 'INR',
};

const USERS = [
  { name: 'Admin User',    email: 'admin@trackflow.com',    password: 'admin1234',    role: 'admin' },
  { name: 'Sarah Manager', email: 'sarah@trackflow.com',    password: 'manager1234',  role: 'manager' },
  { name: 'Bob Employee',  email: 'bob@trackflow.com',      password: 'employee1234', role: 'employee' },
  { name: 'Alice Doe',     email: 'alice@trackflow.com',    password: 'employee1234', role: 'employee' },
];

const run = async () => {
  console.log('\n🌱 TrackFlow Seed Script\n');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // ── Check if already seeded ─────────────────────────────────────────────
    const existing = await Company.findOne({ name: COMPANY.name });
    if (existing) {
      console.log('⚠️  Demo company already exists. Skipping company/user creation.');
      console.log('   To reseed, manually delete the company in MongoDB Atlas.\n');
      await mongoose.disconnect();
      return printCredentials();
    }

    // ── Create Company ───────────────────────────────────────────────────────
    const company = await Company.create(COMPANY);
    console.log(`🏢 Created company: ${company.name} (ID: ${company._id})`);

    // ── Create Users ─────────────────────────────────────────────────────────
    const createdUsers = {};
    for (const u of USERS) {
      const newUser = new User({ ...u, company: company._id });
      await newUser.save(); // triggers password hashing pre-save hook
      createdUsers[u.role] = createdUsers[u.role] || newUser;
      console.log(`   👤 Created ${u.role}: ${u.name} (${u.email})`);
    }

    // ── Assign managers to employees ─────────────────────────────────────────
    const manager  = await User.findOne({ email: 'sarah@trackflow.com' });
    await User.updateMany(
      { company: company._id, role: 'employee' },
      { $set: { manager: manager._id } }
    );
    console.log('\n   ↳ Assigned Sarah as manager for all employees');

    // ── Create Approval Rules ─────────────────────────────────────────────────
    const rules = [
      {
        name: 'Travel — Manager Sequential', category: 'travel', flowType: 'sequential',
        approvers: [manager._id], isManagerApprover: false, priority: 10,
        company: company._id,
      },
      {
        name: 'General Default Rule', category: null, flowType: 'sequential',
        approvers: [manager._id], isManagerApprover: false, priority: 0,
        company: company._id,
      },
    ];
    await ApprovalRule.insertMany(rules);
    console.log('\n📋 Created 2 approval rules');

    // ── Create Sample Expenses ────────────────────────────────────────────────
    const bob   = await User.findOne({ email: 'bob@trackflow.com' });
    const alice = await User.findOne({ email: 'alice@trackflow.com' });

    const expenses = [
      { user: bob._id, company: company._id, amount: 5000, currency: 'INR', convertedAmount: 5000, category: 'travel', description: 'Flight to Mumbai for client meeting', date: new Date('2025-03-15'), paidBy: 'employee', status: 'approved', currentStep: 0 },
      { user: bob._id, company: company._id, amount: 1200, currency: 'INR', convertedAmount: 1200, category: 'meals', description: 'Team lunch after sprint review', date: new Date('2025-03-18'), paidBy: 'employee', status: 'pending', currentStep: 1 },
      { user: alice._id, company: company._id, amount: 8000, currency: 'INR', convertedAmount: 8000, category: 'software', description: 'AWS Subscription renewal', date: new Date('2025-03-20'), paidBy: 'company_card', status: 'pending', currentStep: 1 },
      { user: bob._id, company: company._id, amount: 3500, currency: 'INR', convertedAmount: 3500, category: 'accommodation', description: 'Hotel stay in Delhi', date: new Date('2025-03-10'), paidBy: 'employee', status: 'rejected', currentStep: 0 },
      { user: alice._id, company: company._id, amount: 2000, currency: 'INR', convertedAmount: 2000, category: 'software', description: 'Postman Pro annual plan', date: new Date('2025-03-22'), paidBy: 'employee', status: 'draft', currentStep: 0 },
    ];
    await Expense.insertMany(expenses);
    console.log('🧾 Created 5 sample expenses\n');

    printCredentials();
    console.log('✅ Seeding complete!\n');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

function printCredentials() {
  console.log('─'.repeat(50));
  console.log('  DEMO LOGIN CREDENTIALS');
  console.log('─'.repeat(50));
  console.log('  👑 Admin    admin@trackflow.com   / admin1234');
  console.log('  👔 Manager  sarah@trackflow.com   / manager1234');
  console.log('  👤 Employee bob@trackflow.com     / employee1234');
  console.log('  👤 Employee alice@trackflow.com   / employee1234');
  console.log('─'.repeat(50) + '\n');
}

run();
