const User = require('../models/User');
const School = require('../models/School');
const AuditLog = require('../models/AuditLog');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');

const log = (actor, action, targetId, targetModel, details = {}) =>
  AuditLog.create({ actorId: String(actor._id), actorName: actor.name, actorRole: actor.role, action, targetId: String(targetId), targetModel, details });

// Dashboard stats
const getDashboardStats = async (req, res) => {
  const [schools, teachers, students, principals] = await Promise.all([
    School.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'teacher', isActive: true }),
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'principal', isActive: true })
  ]);
  const recentLogs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(10);
  sendSuccess(res, { stats: { schools, teachers, students, principals }, recentLogs });
};

// --- Schools ---
const getSchools = async (req, res) => {
  const { search, isActive } = req.query;
  let schools = await School.find({});
  if (search) schools = schools.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  if (isActive !== undefined) schools = schools.filter(s => String(s.isActive) === isActive);
  sendSuccess(res, { schools });
};

const createSchool = async (req, res) => {
  const { name, address, logo, contactEmail, phone } = req.body;
  const school = await School.create({ name, address, logo, contactEmail, phone, createdBy: String(req.user._id) });

  // Create school account user
  const schoolUser = await User.create({
    name,
    email: contactEmail,
    password: 'School@123',
    role: 'school',
    schoolId: school._id,          // pass ObjectId directly, not a string
    isActive: true
  });

  await School.findByIdAndUpdate(school._id, { schoolUserId: String(schoolUser._id) });
  await log(req.user, 'CREATE_SCHOOL', school._id, 'School', { name });
  sendSuccess(res, { school }, 'School created successfully.', 201);
};

const getSchool = async (req, res) => {
  const school = await School.findById(req.params.id);
  if (!school) return sendError(res, 'School not found.', 404);
  const [teachers, students, principals] = await Promise.all([
    User.countDocuments({ schoolId: req.params.id, role: 'teacher' }),
    User.countDocuments({ schoolId: req.params.id, role: 'student' }),
    User.countDocuments({ schoolId: req.params.id, role: 'principal' })
  ]);
  sendSuccess(res, { school, counts: { teachers, students, principals } });
};

const updateSchool = async (req, res) => {
  const school = await School.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!school) return sendError(res, 'School not found.', 404);
  await log(req.user, 'UPDATE_SCHOOL', school._id, 'School');
  sendSuccess(res, { school });
};

const toggleSchoolActive = async (req, res) => {
  const school = await School.findById(req.params.id);
  if (!school) return sendError(res, 'School not found.', 404);
  const updated = await School.findByIdAndUpdate(req.params.id, { isActive: !school.isActive }, { new: true });
  await log(req.user, updated.isActive ? 'ACTIVATE_SCHOOL' : 'DEACTIVATE_SCHOOL', school._id, 'School');
  sendSuccess(res, { school: updated });
};

const deleteSchool = async (req, res) => {
  const school = await School.findByIdAndDelete(req.params.id);
  if (!school) return sendError(res, 'School not found.', 404);
  await User.deleteMany({ schoolId: req.params.id });
  await log(req.user, 'DELETE_SCHOOL', req.params.id, 'School', { name: school.name });
  sendSuccess(res, {}, 'School deleted.');
};

// --- Generic user CRUD for super admin ---
const getUsers = async (req, res) => {
  const { role, schoolId, search, isActive } = req.query;
  let query = {};
  if (role) query.role = role;
  if (schoolId) query.schoolId = schoolId;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  let users = await User.find(query);
  if (search) users = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  sendSuccess(res, { users });
};

const ROLE_DEFAULT_PASSWORDS = {
  teacher: 'Teacher@123',
  student: 'Student@123',
  principal: 'Principal@123',
  school: 'School@123'
};

const createUser = async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  const schoolId = req.body.schoolId || null;   // never pass empty string to Mongoose ObjectId
  const allowedRoles = ['school', 'principal', 'teacher', 'student'];
  if (!allowedRoles.includes(role)) return sendError(res, 'Invalid role.', 400);
  const existing = await User.findOne({ email });
  if (existing) return sendError(res, 'Email already in use.', 400);
  const defaultPassword = ROLE_DEFAULT_PASSWORDS[role] || 'School@123';
  const user = await User.create({ name, email, password: password || defaultPassword, role, schoolId, phone, isActive: true });
  await log(req.user, `CREATE_${role.toUpperCase()}`, user._id, 'User', { name, email, role });
  sendSuccess(res, { user, defaultPassword: password ? null : defaultPassword }, 'User created.', 201);
};

const getUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 'User not found.', 404);
  sendSuccess(res, { user });
};

const updateUser = async (req, res) => {
  const { name, email, phone, schoolId } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { name, email, phone, schoolId }, { new: true });
  if (!user) return sendError(res, 'User not found.', 404);
  await log(req.user, 'UPDATE_USER', user._id, 'User');
  sendSuccess(res, { user });
};

const toggleUserActive = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 'User not found.', 404);
  const updated = await User.findByIdAndUpdate(req.params.id, { isActive: !user.isActive }, { new: true });
  await log(req.user, updated.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', user._id, 'User');
  sendSuccess(res, { user: updated });
};

const transferTeacher = async (req, res) => {
  const { newSchoolId } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { schoolId: newSchoolId }, { new: true });
  if (!user) return sendError(res, 'User not found.', 404);
  await log(req.user, 'TRANSFER_TEACHER', user._id, 'User', { newSchoolId });
  sendSuccess(res, { user });
};

const getAuditLogs = async (req, res) => {
  const { schoolId, limit = 50 } = req.query;
  let logs = await AuditLog.find(schoolId ? { schoolId } : {});
  logs = logs.slice(-Number(limit)).reverse();
  sendSuccess(res, { logs });
};

module.exports = {
  getDashboardStats, getSchools, createSchool, getSchool, updateSchool, toggleSchoolActive, deleteSchool,
  getUsers, createUser, getUser, updateUser, toggleUserActive, transferTeacher, getAuditLogs
};
