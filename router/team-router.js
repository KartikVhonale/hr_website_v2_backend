const express = require('express');
const TeamController = require('../controllers/team-controller');
const { verifyToken, requireAdmin } = require('../middleware/auth-middleware');
const router = express.Router();

router
  .route('/')
  .get(TeamController.getAllTeamMembers)
  .post(verifyToken, requireAdmin, TeamController.createTeamMember);

router
  .route('/:id')
  .put(verifyToken, requireAdmin, TeamController.updateTeamMember)
  .delete(verifyToken, requireAdmin, TeamController.deleteTeamMember);

module.exports = router;
