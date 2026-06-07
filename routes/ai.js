const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { sendMessage, streamMessage, getChats, getChatById, deleteChat, summarize, summarizeUrlEndpoint, explainConcept } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');

router.use(protect);

router.post('/chat',
  aiRateLimiter,
  [
    body('message').trim().isLength({ min: 1, max: 4000 }).withMessage('Message must be 1-4000 characters'),
    body('language').optional().isIn(['arabic', 'english', 'lebanese']),
    body('subject').optional().trim().isLength({ max: 100 })
  ],
  validate,
  sendMessage
);

router.post('/chat/stream', aiRateLimiter, streamMessage);

router.get('/chats', getChats);
router.get('/chats/:id', getChatById);
router.delete('/chats/:id', deleteChat);

router.post('/summarize',
  aiRateLimiter,
  [
    body('text').trim().isLength({ min: 100 }).withMessage('Text must be at least 100 characters'),
    body('language').optional().isIn(['arabic', 'english', 'lebanese'])
  ],
  validate,
  summarize
);

router.post('/summarize-url',
  aiRateLimiter,
  [body('url').trim().isURL().withMessage('Valid URL is required')],
  validate,
  summarizeUrlEndpoint
);

router.post('/explain',
  aiRateLimiter,
  [
    body('concept').trim().isLength({ min: 2, max: 500 }).withMessage('Concept must be 2-500 characters'),
    body('subject').optional().trim().isLength({ max: 100 })
  ],
  validate,
  explainConcept
);

module.exports = router;
