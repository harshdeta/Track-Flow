const AppError = require('../utils/AppError');

/**
 * Validation Middleware
 * Lightweight schema-based request body validator.
 * Usage: validate(schema) where schema = { field: { required, type, min, max, enum } }
 *
 * Example:
 *   router.post('/expenses', protect, validate(expenseSchema), createExpense)
 */

// ─── Common Validation Schemas ────────────────────────────────────────────────

const schemas = {
  signup: {
    companyName: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    country:     { required: true, type: 'string' },
    baseCurrency:{ required: true, type: 'string', minLength: 3, maxLength: 3 },
    name:        { required: true, type: 'string', minLength: 2 },
    email:       { required: true, type: 'email' },
    password:    { required: true, type: 'string', minLength: 6 },
  },

  login: {
    email:    { required: true, type: 'email' },
    password: { required: true, type: 'string' },
  },

  createUser: {
    name:     { required: true, type: 'string', minLength: 2 },
    email:    { required: true, type: 'email' },
    password: { required: true, type: 'string', minLength: 6 },
    role:     { required: false, type: 'string', enum: ['manager', 'employee'] },
  },

  createExpense: {
    amount:       { required: true, type: 'number', min: 0.01 },
    currency:     { required: true, type: 'string', minLength: 3, maxLength: 3 },
    category:     { required: true, type: 'string', enum: ['travel','accommodation','meals','office_supplies','software','hardware','training','medical','other'] },
    description:  { required: true, type: 'string', minLength: 5, maxLength: 500 },
    date:         { required: true, type: 'date' },
  },

  createApprovalRule: {
    name:     { required: true, type: 'string', minLength: 2 },
    flowType: { required: false, type: 'string', enum: ['sequential', 'parallel'] },
    minApprovalPercent: { required: false, type: 'number', min: 1, max: 100 },
  },

  approvalAction: {
    comment: { required: false, type: 'string', maxLength: 1000 },
  },
};

// ─── Validator Function ───────────────────────────────────────────────────────

/**
 * validate — Returns an Express middleware that validates req.body against a schema.
 * @param {string|Object} schema - Schema name (from schemas map) or inline schema object
 */
const validate = (schema) => {
  const s = typeof schema === 'string' ? schemas[schema] : schema;

  return (req, res, next) => {
    const errors = [];
    const body = req.body || {};

    for (const [field, rules] of Object.entries(s)) {
      const value = body[field];
      const isEmpty = value === undefined || value === null || value === '';

      // ── Required check ────────────────────────────────────────────────────
      if (rules.required && isEmpty) {
        errors.push(`'${field}' is required.`);
        continue;
      }

      if (isEmpty) continue; // Optional field not provided — skip

      // ── Type checks ────────────────────────────────────────────────────────
      if (rules.type === 'email') {
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(value)) {
          errors.push(`'${field}' must be a valid email address.`);
        }
      } else if (rules.type === 'number') {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`'${field}' must be a number.`);
        } else {
          if (rules.min !== undefined && num < rules.min) {
            errors.push(`'${field}' must be at least ${rules.min}.`);
          }
          if (rules.max !== undefined && num > rules.max) {
            errors.push(`'${field}' must be at most ${rules.max}.`);
          }
        }
      } else if (rules.type === 'string') {
        if (typeof value !== 'string') {
          errors.push(`'${field}' must be a string.`);
        } else {
          if (rules.minLength && value.length < rules.minLength) {
            errors.push(`'${field}' must be at least ${rules.minLength} characters.`);
          }
          if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`'${field}' cannot exceed ${rules.maxLength} characters.`);
          }
        }
      } else if (rules.type === 'date') {
        const d = new Date(value);
        if (isNaN(d.getTime())) {
          errors.push(`'${field}' must be a valid date (e.g. 2025-03-15).`);
        }
      }

      // ── Enum check ─────────────────────────────────────────────────────────
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`'${field}' must be one of: ${rules.enum.join(', ')}.`);
      }
    }

    if (errors.length > 0) {
      return next(new AppError(errors.join(' | '), 400));
    }

    next();
  };
};

module.exports = { validate, schemas };
