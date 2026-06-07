const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');

const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, 'An account with this email already exists.', 400);
  }

  const allowedRoles = ['student', 'teacher'];
  const userRole = allowedRoles.includes(role) ? role : 'student';

  const user = await User.create({ name, email, password, role: userRole });
  const token = generateToken(user._id);

  await User.findByIdAndUpdate(user._id, { lastActive: Date.now() });

  sendSuccess(res, { user, token }, 'Account created successfully!', 201);
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return sendError(res, 'Invalid email or password.', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return sendError(res, 'Invalid email or password.', 401);
  }

  const token = generateToken(user._id);

  await User.findByIdAndUpdate(user._id, { lastActive: Date.now() });

  const userObj = user.toJSON();
  sendSuccess(res, { user: userObj, token }, 'Logged in successfully!');
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

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true
  });

  sendSuccess(res, { user }, 'Profile updated successfully.');
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return sendError(res, 'Current password is incorrect.', 400);
  }

  user.password = newPassword;
  await user.save();

  const token = generateToken(user._id);
  sendSuccess(res, { token }, 'Password changed successfully.');
};

module.exports = { register, login, getMe, updateProfile, changePassword };
