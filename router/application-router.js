const express = require('express');
const ApplicationController = require('../controllers/application-controller');
const { verifyToken, requireAdmin, requireJobseeker } = require('../middleware/auth-middleware');
const { applicationValidations } = require('../middleware/validation-middleware');
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(verifyToken, ApplicationController.getJobApplications)
  .post(verifyToken, requireJobseeker, applicationValidations.create, ApplicationController.applyForJob);

router
  .route('/:id')
  .put(verifyToken, applicationValidations.updateStatus, ApplicationController.updateApplicationStatus);

router
  .route('/employer/:employerId')
  .get(verifyToken, ApplicationController.getApplicationsByEmployer);

module.exports = router;
