const User = require('../models/User');
const School = require('../models/School');
const Classroom = require('../models/Classroom');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/response');

const log = (actor, action, targetId, targetModel, details = {}) =>
  AuditLog.create({ actorId: String(actor._id), actorName: actor.name, actorRole: actor.role, action, targetId: String(targetId || ''), targetModel, details, schoolId: actor.schoolId });

const getDashboardStats = async (req, res) => {
  const schoolId = String(req.user.schoolId);
  const [teachers, students, principals, classrooms] = await Promise.all([
    User.countDocuments({ schoolId, role: 'teacher', isActive: true }),
    User.countDocuments({ schoolId, role: 'student', isActive: true }),
    User.countDocuments({ schoolId, role: 'principal', isActive: true }),
    Classroom.countDocuments({ schoolId })
  ]);
  const school = await School.findById(schoolId);
  sendSuccess(res, { stats: { teachers, students, principals, classrooms }, school });
};

const getSchoolProfile = async (req, res) => {
  const school = await School.findById(req.user.schoolId);
  if (!school) return sendError(res, 'School not found.', 404);
  sendSuccess(res, { school });
};

const updateSchoolProfile = async (req, res) => {
  const { name, address, logo, phone, academicYear } = req.body;
  const school = await School.findByIdAndUpdate(req.user.schoolId, { name, address, logo, phone, academicYear }, { new: true });
  sendSuccess(res, { school });
};

const getTeachers = async (req, res) => {
  const { search } = req.query;
  let teachers = await User.find({ schoolId: String(req.user.schoolId), role: 'teacher' });
  if (search) teachers = teachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase()));
  sendSuccess(res, { teachers });
};

const createTeacher = async (req, res) => {
  const { name, email, password, phone } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return sendError(res, 'Email already in use.', 400);
  const teacher = await User.create({ name, email, password: password || 'Teacher@123', role: 'teacher', schoolId: String(req.user.schoolId), phone, isActive: true });
  await log(req.user, 'CREATE_TEACHER', teacher._id, 'User', { name, email });
  sendSuccess(res, { teacher }, 'Teacher account created.', 201);
};

const updateTeacher = async (req, res) => {
  const { name, email, phone } = req.body;
  const teacher = await User.findOne({ _id: req.params.id, schoolId: String(req.user.schoolId), role: 'teacher' });
  if (!teacher) return sendError(res, 'Teacher not found.', 404);
  const updated = await User.findByIdAndUpdate(req.params.id, { name, email, phone }, { new: true });
  sendSuccess(res, { teacher: updated });
};

const toggleTeacher = async (req, res) => {
  const teacher = await User.findOne({ _id: req.params.id, schoolId: String(req.user.schoolId), role: 'teacher' });
  if (!teacher) return sendError(res, 'Teacher not found.', 404);
  const updated = await User.findByIdAndUpdate(req.params.id, { isActive: !teacher.isActive }, { new: true });
  sendSuccess(res, { teacher: updated });
};

const getStudents = async (req, res) => {
  const { search } = req.query;
  let students = await User.find({ schoolId: String(req.user.schoolId), role: 'student' });
  if (search) students = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  sendSuccess(res, { students });
};

const createStudent = async (req, res) => {
  const { name, email, password, phone } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return sendError(res, 'Email already in use.', 400);
  const student = await User.create({ name, email, password: password || 'Student@123', role: 'student', schoolId: String(req.user.schoolId), phone, isActive: true });
  await log(req.user, 'CREATE_STUDENT', student._id, 'User', { name, email });
  sendSuccess(res, { student }, 'Student account created.', 201);
};

const updateStudent = async (req, res) => {
  const { name, email, phone } = req.body;
  const student = await User.findOne({ _id: req.params.id, schoolId: String(req.user.schoolId), role: 'student' });
  if (!student) return sendError(res, 'Student not found.', 404);
  const updated = await User.findByIdAndUpdate(req.params.id, { name, email, phone }, { new: true });
  sendSuccess(res, { student: updated });
};

const toggleStudent = async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, schoolId: String(req.user.schoolId), role: 'student' });
  if (!student) return sendError(res, 'Student not found.', 404);
  const updated = await User.findByIdAndUpdate(req.params.id, { isActive: !student.isActive }, { new: true });
  sendSuccess(res, { student: updated });
};

const getPrincipals = async (req, res) => {
  const principals = await User.find({ schoolId: String(req.user.schoolId), role: 'principal' });
  sendSuccess(res, { principals });
};

const createPrincipal = async (req, res) => {
  const { name, email, password, phone } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return sendError(res, 'Email already in use.', 400);
  const principal = await User.create({ name, email, password: password || 'Principal@123', role: 'principal', schoolId: String(req.user.schoolId), phone, isActive: true });
  await log(req.user, 'CREATE_PRINCIPAL', principal._id, 'User', { name, email });
  sendSuccess(res, { principal }, 'Principal account created.', 201);
};

const togglePrincipal = async (req, res) => {
  const principal = await User.findOne({ _id: req.params.id, schoolId: String(req.user.schoolId), role: 'principal' });
  if (!principal) return sendError(res, 'Principal not found.', 404);
  const updated = await User.findByIdAndUpdate(req.params.id, { isActive: !principal.isActive }, { new: true });
  sendSuccess(res, { principal: updated });
};

module.exports = {
  getDashboardStats, getSchoolProfile, updateSchoolProfile,
  getTeachers, createTeacher, updateTeacher, toggleTeacher,
  getStudents, createStudent, updateStudent, toggleStudent,
  getPrincipals, createPrincipal, togglePrincipal
};
