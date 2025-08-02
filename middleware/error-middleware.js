const mongoose = require('mongoose');

// Custom error class for application-specific errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle Mongoose CastError (Invalid ObjectId)
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Handle Mongoose duplicate field error
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// Handle Mongoose validation error
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle JWT errors
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

// Send error response in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Send error response in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    
    res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  }
};

// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error details
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

// Async error wrapper to catch async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Handle unhandled promise rejections
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (err, promise) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
  });
};

// Handle uncaught exceptions
const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
  });
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
  const message = `Can't find ${req.originalUrl} on this server!`;
  const error = new AppError(message, 404);
  next(error);
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  return errors.map(error => ({
    field: error.path,
    message: error.msg,
    value: error.value
  }));
};

// Security error handler
const handleSecurityError = (type, req, res) => {
  console.warn(`Security violation detected: ${type}`, {
    ip: req.ip,
    url: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  res.status(403).json({
    success: false,
    message: 'Security violation detected. Access denied.'
  });
};

// File upload error handler
const handleFileUploadError = (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5MB.'
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Too many files. Maximum is 1 file per upload.'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field. Please check your form.'
    });
  }
  
  if (err.message && err.message.includes('Only PDF files are allowed')) {
    return res.status(400).json({
      success: false,
      message: 'Only PDF files are allowed for resume uploads.'
    });
  }
  
  next(err);
};

// Database connection error handler
const handleDatabaseError = (err) => {
  console.error('Database connection error:', err);
  
  if (err.name === 'MongoNetworkError') {
    return new AppError('Database connection failed. Please try again later.', 503);
  }
  
  if (err.name === 'MongoTimeoutError') {
    return new AppError('Database operation timed out. Please try again.', 504);
  }
  
  return new AppError('Database error occurred.', 500);
};

module.exports = {
  AppError,
  globalErrorHandler,
  catchAsync,
  handleUnhandledRejection,
  handleUncaughtException,
  notFound,
  formatValidationErrors,
  handleSecurityError,
  handleFileUploadError,
  handleDatabaseError
};
