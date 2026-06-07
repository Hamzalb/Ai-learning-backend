const rateLimit = require('express-rate-limit');

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many authentication attempts. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: 'AI request limit reached. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false
});

const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Upload limit reached. Maximum 20 uploads per hour.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { globalRateLimiter, authRateLimiter, aiRateLimiter, uploadRateLimiter };
