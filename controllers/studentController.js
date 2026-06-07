const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Subject = require('../models/Subject');
const Schedule = require('../models/Schedule');
const Document = require('../models/Document');
const Grade = require('../models/Grade');
const Quiz = require('../models/Quiz');
const QuizSubmission = require('../models/QuizSubmission');
const Attendance = require('../models/Attendance');
const Homework = require('../models/Homework');
const Payment = require('../models/Payment');
const { sendSuccess, sendError } = require('../utils/response');

const sid = (req) => String(req.user._id);

const getDashboard = async (req, res) => {
  const studentId = sid(req);
  const classroom = await Classroom.findOne({ studentIds: { $in: [studentId] } });

  const [grades, quizzes, homework, attendance, payments] = await Promise.all([
    Grade.find({ studentId }),
    classroom ? Quiz.find({ classroomId: String(classroom._id) }) : [],
    classroom ? Homework.find({ classroomId: String(classroom._id) }) : [],
    Attendance.find({ studentId }),
    Payment.find({ studentId })
  ]);

  const schedule = classroom ? await Schedule.findOne({ classroomId: String(classroom._id) }) : null;
  const upcomingQuizzes = Array.isArray(quizzes)
    ? quizzes.filter(q => q.dueDate && new Date(q.dueDate) > new Date()).slice(0, 3)
    : [];
  const recentGrades = grades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const pendingHomework = Array.isArray(homework)
    ? homework.filter(h => {
        const mySubmission = (h.submissions || []).find(s => String(s.studentId) === studentId);
        return !mySubmission;
      }).slice(0, 5)
    : [];
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const attendancePercent = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 100;

  sendSuccess(res, {
    classroom,
    schedule: schedule?.slots || [],
    upcomingQuizzes,
    recentGrades,
    pendingHomework,
    attendancePercent,
    overduePayments: payments.filter(p => p.status === 'overdue').length
  });
};

const getDocuments = async (req, res) => {
  const studentId = sid(req);
  const classroom = await Classroom.findOne({ studentIds: { $in: [studentId] } });
  if (!classroom) return sendSuccess(res, { documents: [] });
  const { search, category } = req.query;
  let docs = await Document.find({
    classroomId: String(classroom._id),
    $or: [{ visibility: 'all' }, { visibility: { $in: [studentId] } }]
  });
  if (category) docs = docs.filter(d => d.category === category);
  if (search) docs = docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));
  sendSuccess(res, { documents: docs });
};

const getGrades = async (req, res) => {
  const { subjectId, term } = req.query;
  const query = { studentId: sid(req) };
  if (subjectId) query.subjectId = subjectId;
  if (term) query.term = term;
  const grades = await Grade.find(query);
  const subjects = await Subject.find({ schoolId: String(req.user.schoolId) });
  sendSuccess(res, { grades, subjects });
};

const getQuizzes = async (req, res) => {
  const studentId = sid(req);
  const classroom = await Classroom.findOne({ studentIds: { $in: [studentId] } });
  if (!classroom) return sendSuccess(res, { quizzes: [] });
  const quizzes = await Quiz.find({ classroomId: String(classroom._id) });
  const submissions = await QuizSubmission.find({ studentId });
  const enriched = quizzes.map(q => {
    const sub = submissions.find(s => String(s.quizId) === String(q._id));
    return { ...q.toJSON(), submission: sub || null, status: sub ? 'completed' : 'upcoming' };
  });
  sendSuccess(res, { quizzes: enriched });
};

const submitQuiz = async (req, res) => {
  const { answers } = req.body;
  const quizId = req.params.id;
  const studentId = sid(req);

  const existing = await QuizSubmission.findOne({ quizId, studentId });
  if (existing) return sendError(res, 'Quiz already submitted.', 400);

  const quiz = await Quiz.findById(quizId);
  if (!quiz) return sendError(res, 'Quiz not found.', 404);

  let score = 0;
  const maxScore = quiz.questions?.length || 0;
  const gradedAnswers = (answers || []).map((ans, i) => {
    const q = quiz.questions?.[i];
    let correct = false;
    if (q && (q.type === 'multiple_choice' || q.type === 'true_false')) {
      correct = String(ans.selected) === String(q.correctAnswer);
      if (correct) score++;
    }
    return { ...ans, correct };
  });

  const submission = await QuizSubmission.create({
    quizId, studentId: studentId,
    classroomId: quiz.classroomId,
    answers: gradedAnswers, score, maxScore,
    submittedAt: new Date(), isGraded: true
  });
  sendSuccess(res, { submission, score, maxScore }, 'Quiz submitted.');
};

const getAttendance = async (req, res) => {
  const { subjectId, month } = req.query;
  const query = { studentId: sid(req) };
  if (subjectId) query.subjectId = subjectId;
  let records = await Attendance.find(query);
  if (month) {
    records = records.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === month;
    });
  }
  sendSuccess(res, { attendance: records });
};

const getHomework = async (req, res) => {
  const studentId = sid(req);
  const classroom = await Classroom.findOne({ studentIds: { $in: [studentId] } });
  if (!classroom) return sendSuccess(res, { homework: [] });
  const homework = await Homework.find({ classroomId: String(classroom._id) });
  const enriched = homework.map(h => {
    const mySubmission = (h.submissions || []).find(s => String(s.studentId) === studentId);
    return { ...h.toJSON(), mySubmission: mySubmission || null, status: mySubmission ? (mySubmission.grade != null ? 'graded' : 'submitted') : 'pending' };
  });
  sendSuccess(res, { homework: enriched });
};

const submitHomework = async (req, res) => {
  const { text } = req.body;
  const hw = await Homework.findById(req.params.id);
  if (!hw) return sendError(res, 'Homework not found.', 404);
  const studentId = sid(req);
  const existing = (hw.submissions || []).find(s => String(s.studentId) === studentId);
  if (existing) return sendError(res, 'Already submitted.', 400);
  const submissions = [...(hw.submissions || []), { studentId, text, submittedAt: new Date(), status: 'submitted' }];
  await Homework.findByIdAndUpdate(req.params.id, { submissions });
  sendSuccess(res, {}, 'Homework submitted.');
};

const getPayments = async (req, res) => {
  const payments = await Payment.find({ studentId: sid(req) });
  sendSuccess(res, { payments });
};

const getSchedule = async (req, res) => {
  const studentId = sid(req);
  const classroom = await Classroom.findOne({ studentIds: { $in: [studentId] } });
  if (!classroom) return sendSuccess(res, { schedule: null });
  const schedule = await Schedule.findOne({ classroomId: String(classroom._id) });
  const subjects = await Subject.find({ classroomId: String(classroom._id) });
  sendSuccess(res, { schedule: schedule?.slots || [], subjects });
};

module.exports = {
  getDashboard, getDocuments, getGrades, getQuizzes, submitQuiz,
  getAttendance, getHomework, submitHomework, getPayments, getSchedule
};
