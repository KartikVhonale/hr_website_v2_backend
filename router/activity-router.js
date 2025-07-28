const express = require('express');
const router = express.Router();
const ActivityController = require('../controllers/activity-controller');
const { verifyToken, requireAdmin } = require('../middleware/auth-middleware');

router.get('/', verifyToken, requireAdmin, ActivityController.getRecentActivity);

module.exports = router;
