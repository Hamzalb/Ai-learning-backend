const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');

const ROLE_REDIRECTS = {
  super_admin: '/super-admin/dashboard',
  school: '/school/dashboard',
  principal: '/principal/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard'
};

const login = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) return sendError(res, 'Invalid email or password.', 401);

  if (!user.isActive) return sendError(res, 'Account is deactivated. Contact your administrator.', 403);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return sendError(res, 'Invalid email or password.', 401);

  const token = generateToken(user._id, user.role, !!rememberMe);
  await User.findByIdAndUpdate(user._id, { lastActive: Date.now() });

  await AuditLog.create({
    actorId: String(user._id),
    actorName: user.name,
    actorRole: user.role,
    action: 'LOGIN',
    targetModel: 'User',
    schoolId: user.schoolId
  });

  sendSuccess(res, {
    user: user.toJSON(),
    token,
    redirect: ROLE_REDIRECTS[user.role] || '/dashboard'
  }, 'Logged in successfully!');
};

const logout = async (req, res) => {
  if (req.user) {
    await AuditLog.create({
      actorId: String(req.user._id),
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'LOGOUT',
      targetModel: 'User',
      schoolId: req.user.schoolId
    });
  }
  sendSuccess(res, {}, 'Logged out successfully.');
};

const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  sendSuccess(res, { user }, 'User profile retrieved.');
};

const updateProfile = async (req, res) => {
  const { name, preferences } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (preferences) updates.preferences = { ...req.user.preferences, ...preferences };
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  sendSuccess(res, { user }, 'Profile updated successfully.');
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return sendError(res, 'Current password is incorrect.', 400);
  user.password = newPassword;
  await user.save();
  const token = generateToken(user._id, user.role);
  sendSuccess(res, { token }, 'Password changed successfully.');
};

// Admin resets a user's password (no self-reset)
const adminResetPassword = async (req, res) => {
  const { userId, newPassword } = req.body;
  const target = await User.findById(userId);
  if (!target) return sendError(res, 'User not found.', 404);

  // School-level admins can only reset within their school
  if (req.user.role === 'school' && String(target.schoolId) !== String(req.user.schoolId)) {
    return sendError(res, 'Not authorized.', 403);
  }

  target.password = newPassword;
  await target.save();
  sendSuccess(res, {}, 'Password reset successfully.');
};

module.exports = { login, logout, getMe, updateProfile, changePassword, adminResetPassword };
