const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Subject = require('../models/Subject');
const Schedule = require('../models/Schedule');
const { sendSuccess, sendError } = require('../utils/response');

const schoolId = (req) => String(req.user.schoolId);

// Dashboard
const getDashboardStats = async (req, res) => {
  const sid = schoolId(req);
  const classrooms = await Classroom.find({ schoolId: sid });
  const subjects = await Subject.find({ schoolId: sid });
  const teachers = await User.find({ schoolId: sid, role: 'teacher', isActive: true });
  const unassigned = classrooms.filter(c => !c.teacherId).length;
  sendSuccess(res, { stats: { classrooms: classrooms.length, subjects: subjects.length, teachers: teachers.length, unassigned } });
};

// Classrooms
const getClassrooms = async (req, res) => {
  const classrooms = await Classroom.find({ schoolId: schoolId(req) });
  sendSuccess(res, { classrooms });
};

const createClassroom = async (req, res) => {
  const { name, gradeLevel, capacity } = req.body;
  const classroom = await Classroom.create({ name, gradeLevel, capacity: capacity || 30, schoolId: schoolId(req), studentIds: [], subjectIds: [] });
  sendSuccess(res, { classroom }, 'Classroom created.', 201);
};

const updateClassroom = async (req, res) => {
  const classroom = await Classroom.findOne({ _id: req.params.id, schoolId: schoolId(req) });
  if (!classroom) return sendError(res, 'Classroom not found.', 404);
  const updated = await Classroom.findByIdAndUpdate(req.params.id, req.body, { new: true });
  sendSuccess(res, { classroom: updated });
};

const deleteClassroom = async (req, res) => {
  const classroom = await Classroom.findOne({ _id: req.params.id, schoolId: schoolId(req) });
  if (!classroom) return sendError(res, 'Classroom not found.', 404);
  await Classroom.findByIdAndDelete(req.params.id);
  sendSuccess(res, {}, 'Classroom deleted.');
};

const assignStudents = async (req, res) => {
  const { studentIds } = req.body;
  const classroom = await Classroom.findOne({ _id: req.params.id, schoolId: schoolId(req) });
  if (!classroom) return sendError(res, 'Classroom not found.', 404);
  await Classroom.findByIdAndUpdate(req.params.id, { studentIds });
  sendSuccess(res, {}, 'Students assigned.');
};

const assignTeacher = async (req, res) => {
  const { teacherId } = req.body;
  const classroom = await Classroom.findOne({ _id: req.params.id, schoolId: schoolId(req) });
  if (!classroom) return sendError(res, 'Classroom not found.', 404);
  await Classroom.findByIdAndUpdate(req.params.id, { teacherId });
  sendSuccess(res, {}, 'Teacher assigned.');
};

const getClassroomRoster = async (req, res) => {
  const classroom = await Classroom.findOne({ _id: req.params.id, schoolId: schoolId(req) });
  if (!classroom) return sendError(res, 'Classroom not found.', 404);
  const students = classroom.studentIds?.length
    ? await User.find({ _id: { $in: classroom.studentIds } })
    : [];
  sendSuccess(res, { classroom, students });
};

// Subjects
const getSubjects = async (req, res) => {
  const subjects = await Subject.find({ schoolId: schoolId(req) });
  sendSuccess(res, { subjects });
};

const createSubject = async (req, res) => {
  const { name, classroomId, teacherId, color } = req.body;
  const subject = await Subject.create({ name, classroomId, teacherId, color, schoolId: schoolId(req) });
  if (classroomId) {
    const classroom = await Classroom.findById(classroomId);
    if (classroom) {
      const ids = [...(classroom.subjectIds || []), String(subject._id)];
      await Classroom.findByIdAndUpdate(classroomId, { subjectIds: ids });
    }
  }
  sendSuccess(res, { subject }, 'Subject created.', 201);
};

const updateSubject = async (req, res) => {
  const subject = await Subject.findOne({ _id: req.params.id, schoolId: schoolId(req) });
  if (!subject) return sendError(res, 'Subject not found.', 404);
  const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
  sendSuccess(res, { subject: updated });
};

const deleteSubject = async (req, res) => {
  const subject = await Subject.findOne({ _id: req.params.id, schoolId: schoolId(req) });
  if (!subject) return sendError(res, 'Subject not found.', 404);
  await Subject.findByIdAndDelete(req.params.id);
  sendSuccess(res, {}, 'Subject deleted.');
};

// Schedules
const getSchedule = async (req, res) => {
  const { classroomId } = req.query;
  const query = { schoolId: schoolId(req) };
  if (classroomId) query.classroomId = classroomId;
  const schedules = await Schedule.find(query);
  sendSuccess(res, { schedules });
};

const upsertSchedule = async (req, res) => {
  const { classroomId, slots } = req.body;
  let schedule = await Schedule.findOne({ classroomId, schoolId: schoolId(req) });
  if (schedule) {
    schedule = await Schedule.findByIdAndUpdate(schedule._id, { slots }, { new: true });
  } else {
    schedule = await Schedule.create({ classroomId, schoolId: schoolId(req), slots });
  }
  sendSuccess(res, { schedule });
};

module.exports = {
  getDashboardStats,
  getClassrooms, createClassroom, updateClassroom, deleteClassroom, assignStudents, assignTeacher, getClassroomRoster,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getSchedule, upsertSchedule
};
