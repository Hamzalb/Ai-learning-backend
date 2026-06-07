const express = require('express');
const router = express.Router();
const { getDashboard, getHistory, getLeaderboard, getProgress } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/history', getHistory);
router.get('/leaderboard', getLeaderboard);
router.get('/progress', getProgress);

module.exports = router;
