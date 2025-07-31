const express = require('express');
const ApplicationController = require('../controllers/application-controller');
const { verifyToken, requireAdmin, requireJobseeker } = require('../middleware/auth-middleware');
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(verifyToken, ApplicationController.getJobApplications)
  .post(verifyToken, requireJobseeker, ApplicationController.applyForJob);

router
  .route('/:id')
  .put(verifyToken, ApplicationController.updateApplicationStatus);

router
  .route('/employer/:employerId')
  .get(verifyToken, ApplicationController.getApplicationsByEmployer);

module.exports = router;
