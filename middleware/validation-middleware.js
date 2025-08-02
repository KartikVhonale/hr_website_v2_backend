const { body, param, query, validationResult } = require('express-validator');
const xss = require('xss');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param || 'unknown',
      message: error.msg || error.message || 'Validation error',
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  next();
};

// XSS sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  
  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = xss(req.query[key]);
      }
    }
  }
  
  next();
};

// Common validation rules
const commonValidations = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),
    
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
    
  role: body('role')
    .optional()
    .isIn(['jobseeker', 'employer', 'admin'])
    .withMessage('Role must be one of: jobseeker, employer, admin'),
    
  mongoId: param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
    
  phone: body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
    
  url: body('website')
    .optional()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Please provide a valid URL with http or https protocol')
};

// Auth validation rules
const authValidations = {
  signup: [
    commonValidations.name,
    commonValidations.email,
    commonValidations.password,
    commonValidations.role,
    commonValidations.phone,
    body('company')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Company name must be less than 200 characters'),
    body('jobTitle')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Job title must be less than 100 characters'),
    handleValidationErrors
  ],
  
  login: [
    commonValidations.email,
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],
  
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    commonValidations.password,
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      }),
    handleValidationErrors
  ]
};

// Job validation rules
const jobValidations = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Job title must be between 3 and 100 characters'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Job description must be between 10 and 2000 characters'),

    body('ctc')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('CTC information is required and must be less than 50 characters'),
    body('jobType')
      .isIn(['Full-time', 'Part-time', 'Contract', 'Internship'])
      .withMessage('Job type must be one of: Full-time, Part-time, Contract, Internship'),
    body('experienceLevel')
      .isIn(['Entry-level', 'Mid-level', 'Senior-level', 'Lead'])
      .withMessage('Experience level must be one of: Entry-level, Mid-level, Senior-level, Lead'),
    body('skills')
      .isArray({ min: 1, max: 20 })
      .withMessage('Skills must be an array with 1-20 items'),
    body('location')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Location must be between 2 and 100 characters'),
    body('company')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Company name must be between 2 and 100 characters'),
    handleValidationErrors
  ],
  
  update: [
    commonValidations.mongoId,
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Job title must be between 3 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 50, max: 2000 })
      .withMessage('Job description must be between 50 and 2000 characters'),

    body('ctc')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('CTC information must be less than 50 characters'),
    body('jobType')
      .optional()
      .isIn(['Full-time', 'Part-time', 'Contract', 'Internship'])
      .withMessage('Job type must be one of: Full-time, Part-time, Contract, Internship'),
    body('experienceLevel')
      .optional()
      .isIn(['Entry-level', 'Mid-level', 'Senior-level', 'Lead'])
      .withMessage('Experience level must be one of: Entry-level, Mid-level, Senior-level, Lead'),
    body('skills')
      .optional()
      .isArray({ min: 1, max: 20 })
      .withMessage('Skills must be an array with 1-20 items'),
    body('location')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Location must be between 2 and 100 characters'),
    body('company')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Company name must be between 2 and 100 characters'),
    handleValidationErrors
  ],
  
  getById: [
    commonValidations.mongoId,
    handleValidationErrors
  ]
};

// Query validation for search and filtering
const queryValidations = {
  jobSearch: [
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search term must be less than 100 characters'),
    query('q')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search term must be less than 100 characters'),
    query('location')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Location must be less than 100 characters'),
    query('jobType')
      .optional()
      .custom((value) => {
        if (value === '') return true; // Allow empty string
        const validTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'full-time', 'part-time', 'contract', 'internship'];
        return validTypes.includes(value);
      })
      .withMessage('Job type must be one of: Full-time, Part-time, Contract, Internship'),
    query('experienceLevel')
      .optional()
      .custom((value) => {
        if (value === '') return true; // Allow empty string
        const validLevels = ['Entry-level', 'Mid-level', 'Senior-level', 'Lead', 'entry-level', 'mid-level', 'senior-level', 'lead'];
        return validLevels.includes(value);
      })
      .withMessage('Experience level must be one of: Entry-level, Mid-level, Senior-level, Lead'),
    query('page')
      .optional()
      .custom((value) => {
        if (value === '') return true; // Allow empty string
        return Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 1000;
      })
      .withMessage('Page must be a positive integer less than 1000'),
    query('limit')
      .optional()
      .custom((value) => {
        if (value === '') return true; // Allow empty string
        return Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 100;
      })
      .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
  ]
};

// Article validation rules
const articleValidations = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Article title must be between 5 and 200 characters')
      .matches(/^[a-zA-Z0-9\s\-.,()&!?]+$/)
      .withMessage('Article title contains invalid characters'),
    body('content')
      .trim()
      .isLength({ min: 100, max: 10000 })
      .withMessage('Article content must be between 100 and 10000 characters'),
    body('category')
      .isArray({ min: 1, max: 5 })
      .withMessage('Category must be an array with 1-5 items')
      .custom((categories) => {
        const validCategories = ['career', 'technology', 'business', 'education', 'lifestyle', 'news'];
        if (!categories.every(cat => validCategories.includes(cat))) {
          throw new Error('Invalid category. Must be one of: career, technology, business, education, lifestyle, news');
        }
        return true;
      }),
    body('featured')
      .optional()
      .isBoolean()
      .withMessage('Featured must be a boolean value'),
    handleValidationErrors
  ],

  update: [
    commonValidations.mongoId,
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Article title must be between 5 and 200 characters'),
    body('content')
      .optional()
      .trim()
      .isLength({ min: 100, max: 10000 })
      .withMessage('Article content must be between 100 and 10000 characters'),
    body('category')
      .optional()
      .isArray({ min: 1, max: 5 })
      .withMessage('Category must be an array with 1-5 items'),
    body('featured')
      .optional()
      .isBoolean()
      .withMessage('Featured must be a boolean value'),
    handleValidationErrors
  ]
};

// Application validation rules
const applicationValidations = {
  create: [
    param('jobId')
      .isMongoId()
      .withMessage('Invalid job ID format'),
    body('resume')
      .notEmpty()
      .withMessage('Resume is required')
      .isURL()
      .withMessage('Resume must be a valid URL'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must be less than 1000 characters'),
    handleValidationErrors
  ],

  updateStatus: [
    commonValidations.mongoId,
    body('status')
      .isIn(['applied', 'review', 'selected', 'rejected'])
      .withMessage('Status must be one of: applied, review, selected, rejected'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must be less than 1000 characters'),
    handleValidationErrors
  ]
};

// Contact form validation
const contactValidations = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('subject')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Subject must be between 5 and 200 characters'),
    body('message')
      .trim()
      .isLength({ min: 20, max: 2000 })
      .withMessage('Message must be between 20 and 2000 characters'),
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  sanitizeInput,
  commonValidations,
  authValidations,
  jobValidations,
  queryValidations,
  articleValidations,
  applicationValidations,
  contactValidations
};
