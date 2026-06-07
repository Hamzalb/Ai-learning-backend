const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  let message = err.message || 'Internal Server Error';
  let statusCode = err.statusCode || 500;

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    message = errors.join(', ');
    statusCode = 400;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    statusCode = 400;
  }

  if (err.name === 'CastError') {
    message = 'Invalid ID format.';
    statusCode = 400;
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size too large. Maximum 10MB allowed.';
    }
    statusCode = 400;
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  sendError(res, message, statusCode);
};

module.exports = errorHandler;
