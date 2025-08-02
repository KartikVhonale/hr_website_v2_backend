const express = require('express');
const router = express.Router();
const ActivityController = require('../controllers/activity-controller');
const { verifyToken, requireAdmin } = require('../middleware/auth-middleware');

// Activity routes
router.get('/', verifyToken, requireAdmin, ActivityController.getRecentActivity);
router.get('/stats', verifyToken, requireAdmin, ActivityController.getActivityStats);
router.get('/dashboard-summary', verifyToken, ActivityController.getDashboardActivitySummary);
router.get('/type/:type', verifyToken, requireAdmin, ActivityController.getActivityByType);
router.get('/user/:userId', verifyToken, requireAdmin, ActivityController.getUserActivity);

module.exports = router;
