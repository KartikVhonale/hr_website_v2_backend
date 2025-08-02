const express = require('express');
const router = express.Router();
const {
    getAllJobs,
    getJobById,
    updateJob,
    deleteJob,
    createJob,
} = require('../controllers/admin-controller');
const { verifyToken, requireAdmin } = require('../middleware/auth-middleware');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation-middleware');

// Admin job validation
const adminJobValidation = [
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
    body('salary')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 50 })
        .withMessage('Salary information must be less than 50 characters'),
    body('jobType')
        .isIn(['Full-time', 'Part-time', 'Contract', 'Internship'])
        .withMessage('Job type must be one of: Full-time, Part-time, Contract, Internship'),
    body('experienceLevel')
        .isIn(['Entry-level', 'Mid-level', 'Senior-level', 'Lead'])
        .withMessage('Experience level must be one of: Entry-level, Mid-level, Senior-level, Lead'),
    body('location')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Location must be between 2 and 100 characters'),
    body('company')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Company name must be between 2 and 100 characters'),
    body('employerEmail')
        .isEmail()
        .withMessage('Valid employer email is required'),
    handleValidationErrors
];

// Job routes
router.get('/jobs', verifyToken, requireAdmin, getAllJobs);
router.post('/jobs', verifyToken, requireAdmin, adminJobValidation, createJob);
router.get('/jobs/:id', verifyToken, requireAdmin, getJobById);
router.put('/jobs/:id', verifyToken, requireAdmin, updateJob);
router.delete('/jobs/:id', verifyToken, requireAdmin, deleteJob);

module.exports = router;
