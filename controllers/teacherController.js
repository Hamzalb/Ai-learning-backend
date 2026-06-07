const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Subject = require('../models/Subject');
const Grade = require('../models/Grade');
const Document = require('../models/Document');
const Quiz = require('../models/Quiz');
const QuizSubmission = require('../models/QuizSubmission');
const Homework = require('../models/Homework');
const Payment = require('../models/Payment');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendSuccess, sendError } = require('../utils/response');

const upload = multer({
  dest: path.join(__dirname, '..', 'uploads', 'documents'),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('File type not allowed.'));
  }
});

const getDashboardStats = async (req, res) => {
  const teacherId = String(req.user._id);
  const [classes, pendingGrades, quizzes] = await Promise.all([
    Classroom.countDocuments({ teacherId }),
    Grade.countDocuments({ teacherId, score: null }),
    Quiz.countDocuments({ teacherId })
  ]);
  sendSuccess(res, { stats: { classes, pendingGrades, quizzes } });
};

// Classes
const getMyClasses = async (req, res) => {
  const classrooms = await Classroom.find({ teacherId: String(req.user._id) });
  const enriched = await Promise.all(classrooms.map(async c => {
    const studentCount = (c.studentIds || []).length;
    return { ...c.toJSON(), studentCount };
  }));
  sendSuccess(res, { classrooms: enriched });
};

const getClassRoster = async (req, res) => {
  const classroom = await Classroom.findOne({ _id: req.params.id, teacherId: String(req.user._id) });
  if (!classroom) return sendError(res, 'Classroom not found or not assigned to you.', 404);
  const students = classroom.studentIds?.length
    ? await User.find({ _id: { $in: classroom.studentIds } })
    : [];
  sendSuccess(res, { classroom, students });
};

// Grades
const getGrades = async (req, res) => {
  const { classroomId, subjectId, studentId } = req.query;
  const query = { teacherId: String(req.user._id) };
  if (classroomId) query.classroomId = classroomId;
  if (subjectId) query.subjectId = subjectId;
  if (studentId) query.studentId = studentId;
  const grades = await Grade.find(query);
  sendSuccess(res, { grades });
};

const createGrade = async (req, res) => {
  const { studentId, subjectId, classroomId, type, score, maxScore, term, note } = req.body;
  const grade = await Grade.create({
    studentId, subjectId, classroomId, type, score, maxScore: maxScore || 100, term, note,
    teacherId: String(req.user._id), schoolId: String(req.user.schoolId)
  });
  sendSuccess(res, { grade }, 'Grade recorded.', 201);
};

const updateGrade = async (req, res) => {
  const grade = await Grade.findOne({ _id: req.params.id, teacherId: String(req.user._id) });
  if (!grade) return sendError(res, 'Grade not found.', 404);
  const updated = await Grade.findByIdAndUpdate(req.params.id, req.body, { new: true });
  sendSuccess(res, { grade: updated });
};

const deleteGrade = async (req, res) => {
  await Grade.findOneAndDelete({ _id: req.params.id, teacherId: String(req.user._id) });
  sendSuccess(res, {}, 'Grade deleted.');
};

// Documents
const getDocuments = async (req, res) => {
  const { classroomId } = req.query;
  const query = { teacherId: String(req.user._id) };
  if (classroomId) query.classroomId = classroomId;
  const docs = await Document.find(query);
  sendSuccess(res, { documents: docs });
};

const uploadDocument = [
  upload.single('file'),
  async (req, res) => {
    if (!req.file) return sendError(res, 'No file uploaded.', 400);
    const { title, classroomId, visibility, category } = req.body;
    const fileUrl = `/uploads/documents/${req.file.filename}`;
    const doc = await Document.create({
      title,
      fileUrl,
      classroomId,
      teacherId: String(req.user._id),
      schoolId: String(req.user.schoolId),
      visibility: visibility || 'all',
      category: category || 'lecture',
      isProtected: true,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    });
    sendSuccess(res, { document: doc }, 'Document uploaded.', 201);
  }
];

const deleteDocument = async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, teacherId: String(req.user._id) });
  if (!doc) return sendError(res, 'Document not found.', 404);
  const filePath = path.join(__dirname, '..', doc.fileUrl);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await Document.findByIdAndDelete(req.params.id);
  sendSuccess(res, {}, 'Document deleted.');
};

// Quizzes
const getQuizzes = async (req, res) => {
  const quizzes = await Quiz.find({ teacherId: String(req.user._id) });
  sendSuccess(res, { quizzes });
};

const createQuiz = async (req, res) => {
  const { title, description, classroomId, duration, dueDate, questions } = req.body;
  const quiz = await Quiz.create({
    title, description, classroomId, duration, dueDate, questions: questions || [],
    teacherId: String(req.user._id), schoolId: String(req.user.schoolId)
  });
  sendSuccess(res, { quiz }, 'Quiz created.', 201);
};

const updateQuiz = async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.id, teacherId: String(req.user._id) });
  if (!quiz) return sendError(res, 'Quiz not found.', 404);
  const updated = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
  sendSuccess(res, { quiz: updated });
};

const deleteQuiz = async (req, res) => {
  await Quiz.findOneAndDelete({ _id: req.params.id, teacherId: String(req.user._id) });
  sendSuccess(res, {}, 'Quiz deleted.');
};

const getQuizSubmissions = async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.id, teacherId: String(req.user._id) });
  if (!quiz) return sendError(res, 'Quiz not found.', 404);
  const submissions = await QuizSubmission.find({ quizId: req.params.id });
  const enriched = await Promise.all(submissions.map(async s => {
    const student = await User.findById(s.studentId);
    return { ...s.toJSON(), studentName: student?.name || 'Unknown' };
  }));
  sendSuccess(res, { submissions: enriched });
};

// Homework
const getHomework = async (req, res) => {
  const { classroomId } = req.query;
  const query = { teacherId: String(req.user._id) };
  if (classroomId) query.classroomId = classroomId;
  const homework = await Homework.find(query);
  sendSuccess(res, { homework });
};

const createHomework = async (req, res) => {
  const { title, description, classroomId, subjectId, dueDate } = req.body;
  const hw = await Homework.create({
    title, description, classroomId, subjectId, dueDate, submissions: [],
    teacherId: String(req.user._id), schoolId: String(req.user.schoolId)
  });
  sendSuccess(res, { homework: hw }, 'Homework created.', 201);
};

// Teacher financials (payslips)
const getPayslips = async (req, res) => {
  const payments = await Payment.find({ studentId: String(req.user._id) });
  sendSuccess(res, { payments });
};

module.exports = {
  getDashboardStats, getMyClasses, getClassRoster,
  getGrades, createGrade, updateGrade, deleteGrade,
  getDocuments, uploadDocument, deleteDocument,
  getQuizzes, createQuiz, updateQuiz, deleteQuiz, getQuizSubmissions,
  getHomework, createHomework, getPayslips
};
