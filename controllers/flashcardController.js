const Flashcard = require('../models/Flashcard');
const { generateFlashcardsFromText } = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/response');

const NEXT_REVIEW_DAYS = { 0: 0, 1: 1, 2: 3, 3: 7, 4: 30 };

const createFlashcard = async (req, res) => {
  const { front, back, subject, tags } = req.body;
  if (!front || !back) return sendError(res, 'Front and back are required.', 400);
  const card = await Flashcard.create({ front, back, subject: subject || 'general', tags: tags || [], userId: req.user._id, nextReview: new Date() });
  sendSuccess(res, { flashcard: card }, 'Flashcard created.', 201);
};

const getFlashcards = async (req, res) => {
  const { subject, due, page = 1, limit = 50 } = req.query;
  const query = { userId: req.user._id };
  if (subject && subject !== 'all') query.subject = subject;
  if (due === 'true') query.nextReview = { $lte: new Date() };

  const cards = await Flashcard.find(query).sort({ nextReview: 1 });
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, parseInt(limit) || 50);
  const paginated = cards.slice((pageNum - 1) * limitNum, pageNum * limitNum);
  sendSuccess(res, { flashcards: paginated, total: cards.length, dueCount: cards.filter(c => c.nextReview <= new Date()).length });
};

const getFlashcardById = async (req, res) => {
  const card = await Flashcard.findOne({ _id: req.params.id, userId: req.user._id });
  if (!card) return sendError(res, 'Flashcard not found.', 404);
  sendSuccess(res, { flashcard: card });
};

const updateFlashcard = async (req, res) => {
  const { front, back, subject, tags } = req.body;
  const card = await Flashcard.findOne({ _id: req.params.id, userId: req.user._id });
  if (!card) return sendError(res, 'Flashcard not found.', 404);
  if (front !== undefined) card.front = front;
  if (back !== undefined) card.back = back;
  if (subject !== undefined) card.subject = subject;
  if (tags !== undefined) card.tags = tags;
  await card.save();
  sendSuccess(res, { flashcard: card }, 'Flashcard updated.');
};

const deleteFlashcard = async (req, res) => {
  const card = await Flashcard.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!card) return sendError(res, 'Flashcard not found.', 404);
  sendSuccess(res, null, 'Flashcard deleted.');
};

const reviewFlashcard = async (req, res) => {
  const { confidence } = req.body; // 0-4
  if (confidence === undefined || confidence < 0 || confidence > 4) {
    return sendError(res, 'Confidence must be 0-4.', 400);
  }
  const card = await Flashcard.findOne({ _id: req.params.id, userId: req.user._id });
  if (!card) return sendError(res, 'Flashcard not found.', 404);

  card.confidence = confidence;
  card.reviewCount = (card.reviewCount || 0) + 1;
  const days = NEXT_REVIEW_DAYS[confidence] ?? 1;
  const next = new Date();
  next.setDate(next.getDate() + days);
  card.nextReview = days === 0 ? new Date(Date.now() + 60000) : next;
  await card.save();
  sendSuccess(res, { flashcard: card, nextReview: card.nextReview }, 'Review recorded.');
};

const generateFlashcards = async (req, res) => {
  const { text, subject, count = 10, language = 'arabic' } = req.body;
  if (!text || text.trim().length < 50) return sendError(res, 'Text must be at least 50 characters.', 400);
  const generated = await generateFlashcardsFromText(text, subject || 'general', Math.min(count, 30), language);
  const cards = await Promise.all(generated.map(f =>
    Flashcard.create({ ...f, userId: req.user._id, nextReview: new Date() })
  ));
  sendSuccess(res, { flashcards: cards, count: cards.length }, `Generated ${cards.length} flashcards.`, 201);
};

const deleteAllFlashcards = async (req, res) => {
  const { subject } = req.query;
  const query = { userId: req.user._id };
  if (subject && subject !== 'all') query.subject = subject;
  const { deletedCount } = await Flashcard.deleteMany(query);
  sendSuccess(res, { deletedCount }, `Deleted ${deletedCount} flashcards.`);
};

module.exports = { createFlashcard, getFlashcards, getFlashcardById, updateFlashcard, deleteFlashcard, reviewFlashcard, generateFlashcards, deleteAllFlashcards };
