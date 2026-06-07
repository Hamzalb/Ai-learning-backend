const User = require('../models/User');
const Chat = require('../models/Chat');
const Document = require('../models/Document');
const Quiz = require('../models/Quiz');
const { sendSuccess, sendError } = require('../utils/response');

const getDashboard = async (req, res) => {
  const userId = req.user._id;

  const [user, recentChats, recentDocs, recentQuizzes] = await Promise.all([
    User.findById(userId),
    Chat.find({ userId, isArchived: false })
      .select('title subject updatedAt messages')
      .sort({ updatedAt: -1 })
      .limit(5),
    Document.find({ userId })
      .select('title subject processingStatus fileSize createdAt')
      .sort({ createdAt: -1 })
      .limit(5),
    Quiz.find({ userId })
      .select('title difficulty attempts totalPoints createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastActive = new Date(user.lastActive);
  lastActive.setHours(0, 0, 0, 0);
  const dayDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

  let streak = user.streak;
  if (dayDiff === 0) {
    // Same day, no change
  } else if (dayDiff === 1) {
    streak += 1;
    await User.findByIdAndUpdate(userId, { streak, lastActive: Date.now() });
  } else {
    streak = 1;
    await User.findByIdAndUpdate(userId, { streak: 1, lastActive: Date.now() });
  }

  const quizStats = await Quiz.aggregate([
    { $match: { userId } },
    { $unwind: { path: '$attempts', preserveNullAndEmptyArrays: true } },
    { $match: { 'attempts.userId': userId } },
    { $group: { _id: null, avgScore: { $avg: '$attempts.percentage' }, totalAttempts: { $sum: 1 } } }
  ]);

  const badges = [];
  if (user.stats.totalQuizzes >= 1) badges.push('First Quiz');
  if (user.stats.totalDocuments >= 1) badges.push('First Upload');
  if (user.streak >= 7) badges.push('7-Day Streak');
  if (user.xp >= 100) badges.push('100 XP');

  sendSuccess(res, {
    user: { ...user.toJSON(), streak },
    stats: {
      ...user.stats,
      averageScore: quizStats[0]?.avgScore ? Math.round(quizStats[0].avgScore) : 0,
      quizAttempts: quizStats[0]?.totalAttempts || 0
    },
    recentChats: recentChats.map(c => ({
      _id: c._id,
      title: c.title,
      subject: c.subject,
      messageCount: c.messages.length,
      updatedAt: c.updatedAt
    })),
    recentDocuments: recentDocs,
    recentQuizzes: recentQuizzes.map(q => ({
      _id: q._id,
      title: q.title,
      difficulty: q.difficulty,
      attemptCount: q.attempts.length,
      lastScore: q.attempts.length > 0 ? q.attempts[q.attempts.length - 1].percentage : null,
      createdAt: q.createdAt
    })),
    badges
  });
};

const getHistory = async (req, res) => {
  const userId = req.user._id;
  const { type = 'all' } = req.query;
  const validTypes = ['all', 'chats', 'documents', 'quizzes'];
  if (!validTypes.includes(type)) {
    return sendError(res, `Invalid type. Must be one of: ${validTypes.join(', ')}`, 400);
  }
  const pageNum = Math.max(1, parseInt(req.query.page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  let data = {};

  if (type === 'all' || type === 'chats') {
    data.chats = await Chat.find({ userId })
      .select('title subject language createdAt messages')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
  }

  if (type === 'all' || type === 'documents') {
    data.documents = await Document.find({ userId })
      .select('title subject fileSize processingStatus createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
  }

  if (type === 'all' || type === 'quizzes') {
    const rawQuizzes = await Quiz.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    data.quizzes = rawQuizzes.map(q => ({
      _id: q._id,
      title: q.title,
      difficulty: q.difficulty,
      totalPoints: q.totalPoints,
      createdAt: q.createdAt,
      attemptCount: q.attempts.length,
      lastScore: q.attempts.length > 0 ? q.attempts[q.attempts.length - 1].percentage : null
    }));
  }

  sendSuccess(res, data);
};

const getLeaderboard = async (req, res) => {
  const users = await User.find({ role: 'student' })
    .select('name avatar xp level streak stats.averageScore')
    .sort({ xp: -1 })
    .limit(20);

  const leaderboard = users.map((u, idx) => ({
    rank: idx + 1,
    name: u.name,
    avatar: u.avatar,
    xp: u.xp,
    level: u.level,
    streak: u.streak,
    averageScore: u.stats?.averageScore || 0
  }));

  sendSuccess(res, { leaderboard });
};

const getProgress = async (req, res) => {
  const userId = req.user._id;
  const allQuizzes = await Quiz.find({ userId });
  const allChats = await Chat.find({ userId });

  const subjectMap = {};
  for (const quiz of allQuizzes) {
    const s = quiz.subject || 'General';
    if (!subjectMap[s]) subjectMap[s] = { subject: s, quizCount: 0, totalScore: 0, chatCount: 0, flashcardCount: 0 };
    subjectMap[s].quizCount++;
    const lastAttempt = quiz.attempts[quiz.attempts.length - 1];
    if (lastAttempt) subjectMap[s].totalScore += lastAttempt.percentage;
  }
  for (const chat of allChats) {
    const s = chat.subject || 'general';
    const key = s.charAt(0).toUpperCase() + s.slice(1);
    if (!subjectMap[key]) subjectMap[key] = { subject: key, quizCount: 0, totalScore: 0, chatCount: 0, flashcardCount: 0 };
    subjectMap[key].chatCount++;
  }

  const subjects = Object.values(subjectMap).map(s => ({
    ...s,
    averageScore: s.quizCount > 0 ? Math.round(s.totalScore / s.quizCount) : 0
  }));

  // Weekly activity for last 7 days
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekly = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(); day.setDate(day.getDate() - i);
    const dayStr = day.toLocaleDateString('ar-LB', { weekday: 'short' });
    const start = new Date(day); start.setHours(0, 0, 0, 0);
    const end = new Date(day); end.setHours(23, 59, 59, 999);
    const quizzes = allQuizzes.filter(q => {
      const d = new Date(q.createdAt);
      return d >= start && d <= end;
    }).length;
    const chats = allChats.filter(c => {
      const d = new Date(c.createdAt);
      return d >= start && d <= end;
    }).length;
    weekly.push({ day: dayStr, quizzes, chats, total: quizzes + chats });
  }

  const user = await User.findById(userId);
  sendSuccess(res, { subjects, weekly, totalXP: user?.xp || 0, level: user?.level || 1, streak: user?.streak || 0 });
};

module.exports = { getDashboard, getHistory, getLeaderboard, getProgress };
