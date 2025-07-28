const express = require('express');
const JobController = require('../controllers/job-controller');
const { verifyToken, requireAdmin, requireEmployer } = require('../middleware/auth-middleware');
const applicationRouter = require('./application-router');
const router = express.Router();

// Re-route into other resource routers
router.use('/:jobId/applications', applicationRouter);

router
  .route('/')
  .get(JobController.getAllJobs)
  .post(verifyToken, requireEmployer, JobController.createJob);

router
  .route('/:id')
  .get(JobController.getJob)
  .put(verifyToken, JobController.updateJob)
  .delete(verifyToken, JobController.deleteJob);

router.route('/employer/:employerId').get(JobController.getJobsByEmployer);

module.exports = router;
