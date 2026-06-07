const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Chat = require('../models/Chat');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess } = require('../utils/response');

router.use(protect, authorize('teacher', 'admin'));

router.get('/dashboard', async (req, res) => {
  const [studentCount, quizCount, totalChats] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Quiz.countDocuments({}),
    Chat.countDocuments({})
  ]);
  const topStudents = await User.find({ role: 'student' })
    .sort({ xp: -1 })
    .limit(5);
  sendSuccess(res, {
    stats: { studentCount, quizCount, totalChats },
    topStudents: topStudents.map(s => ({ _id: s._id, name: s.name, xp: s.xp, level: s.level, streak: s.streak, averageScore: s.stats?.averageScore || 0 }))
  });
});

router.get('/students', async (req, res) => {
  const { page = 1, limit = 20, sort = 'xp' } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, parseInt(limit) || 20);
  const students = await User.find({ role: 'student' })
    .sort({ [sort]: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);
  const total = await User.countDocuments({ role: 'student' });
  sendSuccess(res, {
    students: students.map(s => ({
      _id: s._id, name: s.name, email: s.email, xp: s.xp, level: s.level,
      streak: s.streak, stats: s.stats, createdAt: s.createdAt
    })),
    total, page: pageNum, limit: limitNum
  });
});

router.get('/quizzes', async (req, res) => {
  const quizzes = await Quiz.find({}).sort({ createdAt: -1 }).limit(50);
  sendSuccess(res, {
    quizzes: quizzes.map(q => ({
      _id: q._id, title: q.title, subject: q.subject, difficulty: q.difficulty,
      questionCount: q.questions.length, attemptCount: q.attempts.length, createdAt: q.createdAt
    }))
  });
});

router.put('/quiz/:id/publish', async (req, res) => {
  const quiz = await Quiz.findByIdAndUpdate(req.params.id, { isPublic: true });
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });
  sendSuccess(res, null, 'Quiz published.');
});

module.exports = router;
