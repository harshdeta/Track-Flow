const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Supports three roles: admin, manager, employee
 * Admin belongs to a company and is the first user created on signup
 * Employees are linked to a manager for approval hierarchy
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password in queries by default
    },

    role: {
      type: String,
      enum: ['admin', 'manager', 'employee'],
      default: 'employee',
    },

    // Multi-tenancy: every user belongs to a company
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },

    // Manager reference — used for approval routing
    // An employee's direct manager will be the first approver if isManagerApprover is true
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Optional department for reporting/filtering
    department: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
userSchema.index({ company: 1, role: 1 });
// NOTE: email index is already created by unique:true in the schema field above

// ─── Pre-save Hook: Hash password before saving ──────────────────────────────
// NOTE: In Mongoose v7+, async pre-save hooks should NOT call next().
// Mongoose detects the returned Promise and handles it automatically.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return; // Skip if password unchanged
  this.password = await bcrypt.hash(this.password, 12);
});

// ─── Instance Method: Compare plain password with hashed ─────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance Method: Safe user object (no password) ─────────────────────────
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
