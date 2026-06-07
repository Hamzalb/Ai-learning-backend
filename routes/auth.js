const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { login, logout, getMe, updateProfile, changePassword, adminResetPassword } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');

router.post('/login',
  authRateLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  login
);

router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

router.put('/profile', protect,
  [body('name').optional().trim().isLength({ min: 2, max: 50 })],
  validate,
  updateProfile
);

router.put('/change-password', protect,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 })
  ],
  validate,
  changePassword
);

router.post('/reset-password', protect,
  authorize('super_admin', 'school', 'principal'),
  adminResetPassword
);

module.exports = router;
