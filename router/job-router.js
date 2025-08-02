const express = require('express');
const JobController = require('../controllers/job-controller');
const { verifyToken, requireAdmin, requireEmployer } = require('../middleware/auth-middleware');
const { jobValidations, queryValidations } = require('../middleware/validation-middleware');
const { jobCreationLimiter } = require('../middleware/security-middleware');
const applicationRouter = require('./application-router');
const router = express.Router();

// Re-route into other resource routers
router.use('/:jobId/applications', applicationRouter);

router
  .route('/')
  .get(queryValidations.jobSearch, JobController.getAllJobs)
  .post(verifyToken, jobCreationLimiter, jobValidations.create, JobController.createJob);

router
  .route('/:id')
  .get(JobController.getJob) // Temporarily remove validation for testing
  .put(verifyToken, jobValidations.update, JobController.updateJob)
  .delete(verifyToken, jobValidations.getById, JobController.deleteJob);

router.route('/employer/:employerId').get(JobController.getJobsByEmployer);

module.exports = router;
