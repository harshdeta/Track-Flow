const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * User Management Controller
 * Admin-only operations for creating, updating, and managing users within a company.
 */

// ─── POST /api/users ──────────────────────────────────────────────────────────
/**
 * createUser
 * Admin creates a new user (employee or manager) within their company.
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, managerId, department } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required.', 400);
    }

    // Prevent creating another admin via this route
    if (role === 'admin') {
      throw new AppError(
        'Cannot create additional admin users through this endpoint.',
        400
      );
    }

    // Validate managerId if provided
    if (managerId) {
      const manager = await User.findOne({
        _id: managerId,
        company: req.companyId,
        role: { $in: ['manager', 'admin'] },
        isActive: true,
      });

      if (!manager) {
        throw new AppError(
          'Manager not found or does not belong to this company.',
          404
        );
      }
    }

    // Check email uniqueness
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError('A user with this email already exists.', 409);
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'employee',
      company: req.companyId,
      manager: managerId || null,
      department: department || null,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/users ───────────────────────────────────────────────────────────
/**
 * getAllUsers
 * Admin gets all users in their company. Managers see only their direct reports.
 */
const getAllUsers = async (req, res, next) => {
  try {
    let filter = { company: req.companyId };

    // Managers can only see their direct reports
    if (req.user.role === 'manager') {
      filter.manager = req.user._id;
    }

    const { role, isActive, page = 1, limit = 20 } = req.query;

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .populate('manager', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      users,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
/**
 * getUserById
 * Get single user. Admin can fetch any user in company. Others only themselves.
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      company: req.companyId,
    })
      .select('-password')
      .populate('manager', 'name email')
      .populate('company', 'name baseCurrency');

    if (!user) throw new AppError('User not found.', 404);

    // Non-admins can only view their own profile
    if (
      req.user.role !== 'admin' &&
      req.user._id.toString() !== user._id.toString()
    ) {
      throw new AppError('Access denied.', 403);
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/users/:id ─────────────────────────────────────────────────────
/**
 * updateUser
 * Admin can update role, manager, department, and active status.
 */
const updateUser = async (req, res, next) => {
  try {
    const { role, managerId, department, isActive, name } = req.body;

    const user = await User.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!user) throw new AppError('User not found.', 404);

    // Prevent demoting the only admin
    if (user.role === 'admin' && role && role !== 'admin') {
      const adminCount = await User.countDocuments({
        company: req.companyId,
        role: 'admin',
        isActive: true,
      });
      if (adminCount <= 1) {
        throw new AppError(
          'Cannot change role. This is the only admin in the company.',
          400
        );
      }
    }

    if (managerId) {
      const manager = await User.findOne({
        _id: managerId,
        company: req.companyId,
        isActive: true,
      });
      if (!manager) throw new AppError('Manager not found.', 404);
      user.manager = managerId;
    }

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (department !== undefined) user.department = department;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
/**
 * deactivateUser
 * Soft-delete: sets isActive = false instead of removing the document.
 * Preserves expense history integrity.
 */
const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      company: req.companyId,
    });

    if (!user) throw new AppError('User not found.', 404);

    if (user._id.toString() === req.user._id.toString()) {
      throw new AppError('You cannot deactivate your own account.', 400);
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
};
