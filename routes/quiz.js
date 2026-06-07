const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { generateQuiz, getQuizzes, getQuizById, submitQuiz, deleteQuiz } = require('../controllers/quizController');
const { protect } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');

router.use(protect);

router.post('/generate',
  aiRateLimiter,
  [
    body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
    body('questionCount').optional().isInt({ min: 3, max: 20 }),
    body('language').optional().isIn(['arabic', 'english', 'lebanese'])
  ],
  validate,
  generateQuiz
);

router.get('/', getQuizzes);
router.get('/:id', getQuizById);
router.post('/:id/submit', submitQuiz);
router.delete('/:id', deleteQuiz);

module.exports = router;
