const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { createFlashcard, getFlashcards, getFlashcardById, updateFlashcard, deleteFlashcard, reviewFlashcard, generateFlashcards, deleteAllFlashcards } = require('../controllers/flashcardController');
const { protect } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', getFlashcards);
router.post('/', [body('front').trim().notEmpty(), body('back').trim().notEmpty()], validate, createFlashcard);
router.post('/generate', aiRateLimiter, [body('text').trim().isLength({ min: 50 }).withMessage('Text must be at least 50 characters')], validate, generateFlashcards);
router.delete('/all', deleteAllFlashcards);
router.get('/:id', getFlashcardById);
router.put('/:id', updateFlashcard);
router.delete('/:id', deleteFlashcard);
router.post('/:id/review', [body('confidence').isInt({ min: 0, max: 4 })], validate, reviewFlashcard);

module.exports = router;
