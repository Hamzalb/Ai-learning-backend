const Quiz = require('../models/Quiz');
const Document = require('../models/Document');
const User = require('../models/User');
const { generateQuizFromText } = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/response');

const generateQuiz = async (req, res) => {
  const { documentId, text, difficulty = 'medium', questionCount = 10, language = 'arabic', title, subject } = req.body;

  let sourceText = text;
  let sourceDocId = null;

  if (documentId) {
    const doc = await Document.findOne({ _id: documentId, userId: req.user._id });
    if (!doc) return sendError(res, 'Document not found.', 404);
    if (doc.processingStatus !== 'completed') {
      return sendError(res, 'Document is still being processed.', 400);
    }
    sourceText = doc.extractedText;
    sourceDocId = doc._id;
  }

  if (!sourceText || sourceText.trim().length < 100) {
    return sendError(res, 'Insufficient text content to generate quiz. Need at least 100 characters.', 400);
  }

  const count = Math.min(Math.max(Number(questionCount), 3), 20);
  const generatedQuestions = await generateQuizFromText(sourceText, difficulty, count, language);

  if (!generatedQuestions || generatedQuestions.length === 0) {
    return sendError(res, 'Failed to generate quiz questions. Please try again.', 500);
  }

  const quiz = await Quiz.create({
    title: title || `Quiz - ${new Date().toLocaleDateString('ar-LB')}`,
    subject: subject || 'General',
    difficulty,
    questions: generatedQuestions.map(q => ({
      question: q.question,
      type: q.type || 'mcq',
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      points: difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 15
    })),
    sourceDocumentId: sourceDocId,
    userId: req.user._id,
    language,
    timeLimit: count * 2
  });

  await User.findByIdAndUpdate(req.user._id, {
    $inc: { 'stats.totalQuizzes': 1 },
    lastActive: Date.now()
  });

  sendSuccess(res, { quiz }, 'Quiz generated successfully!', 201);
};

const getQuizzes = async (req, res) => {
  const pageNum = Math.max(1, parseInt(req.query.page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

  const rawQuizzes = await Quiz.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  const quizzes = rawQuizzes.map(q => ({
    _id: q._id,
    title: q.title,
    subject: q.subject,
    difficulty: q.difficulty,
    totalPoints: q.totalPoints,
    timeLimit: q.timeLimit,
    language: q.language,
    createdAt: q.createdAt,
    questionCount: q.questions.length,
    attemptCount: q.attempts.length,
    lastScore: q.attempts.length > 0 ? q.attempts[q.attempts.length - 1].percentage : null,
    questions: q.questions.map(qs => ({
      _id: qs._id,
      question: qs.question,
      type: qs.type,
      options: qs.options,
      points: qs.points
    }))
  }));

  const total = await Quiz.countDocuments({ userId: req.user._id });

  sendSuccess(res, { quizzes, total, page: pageNum, limit: limitNum });
};

const getQuizById = async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id });
  if (!quiz) return sendError(res, 'Quiz not found.', 404);

  const quizForStudent = {
    ...quiz.toObject(),
    questions: quiz.questions.map(q => ({
      _id: q._id,
      question: q.question,
      type: q.type,
      options: q.options,
      points: q.points
    }))
  };

  sendSuccess(res, { quiz: quizForStudent });
};

const submitQuiz = async (req, res) => {
  const { answers, timeTaken } = req.body;

  const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id });
  if (!quiz) return sendError(res, 'Quiz not found.', 404);

  if (!answers || answers.length !== quiz.questions.length) {
    return sendError(res, 'Please answer all questions.', 400);
  }

  let score = 0;
  const results = quiz.questions.map((q, idx) => {
    const isCorrect = answers[idx]?.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim();
    if (isCorrect) score += q.points;
    return {
      question: q.question,
      yourAnswer: answers[idx],
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation,
      points: isCorrect ? q.points : 0
    };
  });

  const percentage = Math.round((score / quiz.totalPoints) * 100);

  quiz.attempts.push({
    userId: req.user._id,
    answers,
    score,
    percentage,
    timeTaken: timeTaken || 0
  });
  await quiz.save();

  const user = await User.findById(req.user._id);
  const totalQuizzes = user.stats.totalQuizzes || 0;
  const currentAvg = user.stats.averageScore || 0;
  const newAvg = Math.round((currentAvg * totalQuizzes + percentage) / (totalQuizzes + 1));

  const xpGained = Math.floor(percentage * 0.5) + (percentage >= 80 ? 20 : 0);

  await User.findByIdAndUpdate(req.user._id, {
    'stats.averageScore': newAvg,
    $inc: { xp: xpGained },
    lastActive: Date.now()
  });

  sendSuccess(res, {
    score,
    totalPoints: quiz.totalPoints,
    percentage,
    xpGained,
    results,
    passed: percentage >= 60,
    grade: percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F'
  }, `Quiz completed! You scored ${percentage}%`);
};

const deleteQuiz = async (req, res) => {
  const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!quiz) return sendError(res, 'Quiz not found.', 404);
  sendSuccess(res, null, 'Quiz deleted successfully.');
};

module.exports = { generateQuiz, getQuizzes, getQuizById, submitQuiz, deleteQuiz };
