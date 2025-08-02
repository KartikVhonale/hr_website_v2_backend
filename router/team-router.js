const express = require('express');
const TeamController = require('../controllers/team-controller');
const { verifyToken, requireAdmin } = require('../middleware/auth-middleware');
const router = express.Router();

router
  .route('/')
  .get(TeamController.getAllTeamMembers)
  .post(verifyToken, requireAdmin, TeamController.createTeamMember);

router
  .route('/search')
  .get(TeamController.searchTeamMembers);

router
  .route('/stats')
  .get(verifyToken, requireAdmin, TeamController.getTeamStats);

router
  .route('/departments')
  .get(TeamController.getTeamDepartments);

router
  .route('/roles')
  .get(TeamController.getTeamRoles);

router
  .route('/:id')
  .get(TeamController.getTeamMemberById)
  .put(verifyToken, requireAdmin, TeamController.updateTeamMember)
  .delete(verifyToken, requireAdmin, TeamController.deleteTeamMember);

module.exports = router;
