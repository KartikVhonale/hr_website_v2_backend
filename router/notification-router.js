const express = require('express');
const NotificationController = require('../controllers/notification-controller');
const { verifyToken, requireAdmin } = require('../middleware/auth-middleware');
const { body, query } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation-middleware');
const router = express.Router();

// Validation middleware
const notificationValidations = {
  create: [
    body('recipients')
      .notEmpty()
      .withMessage('Recipients are required'),
    body('type')
      .isIn([
        'application_received',
        'application_status_update',
        'job_posted',
        'job_expired',
        'interview_scheduled',
        'interview_reminder',
        'profile_viewed',
        'message_received',
        'system_announcement',
        'account_update',
        'password_changed',
        'login_alert',
        'subscription_update',
        'payment_reminder',
        'document_uploaded',
        'document_verified',
        'article_published',
        'comment_received',
        'like_received',
        'follow_received',
        'job_recommendation',
        'candidate_recommendation',
        'deadline_reminder',
        'maintenance_notice',
        'feature_announcement',
        'security_alert'
      ])
      .withMessage('Invalid notification type'),
    body('title')
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('message')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority level'),
    handleValidationErrors
  ],
  
  bulkSend: [
    body('userFilters')
      .isObject()
      .withMessage('User filters must be an object'),
    body('type')
      .isIn([
        'application_received',
        'application_status_update',
        'job_posted',
        'job_expired',
        'interview_scheduled',
        'interview_reminder',
        'profile_viewed',
        'message_received',
        'system_announcement',
        'account_update',
        'password_changed',
        'login_alert',
        'subscription_update',
        'payment_reminder',
        'document_uploaded',
        'document_verified',
        'article_published',
        'comment_received',
        'like_received',
        'follow_received',
        'job_recommendation',
        'candidate_recommendation',
        'deadline_reminder',
        'maintenance_notice',
        'feature_announcement',
        'security_alert'
      ])
      .withMessage('Invalid notification type'),
    body('title')
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('message')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters'),
    handleValidationErrors
  ],

  query: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['unread', 'read', 'archived'])
      .withMessage('Invalid status'),
    query('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    handleValidationErrors
  ]
};

// Routes
router
  .route('/')
  .get(verifyToken, notificationValidations.query, NotificationController.getUserNotifications)
  .post(verifyToken, requireAdmin, notificationValidations.create, NotificationController.createNotification);

router
  .route('/unread-count')
  .get(verifyToken, NotificationController.getUnreadNotificationCount);

router
  .route('/mark-all-read')
  .put(verifyToken, NotificationController.markAllNotificationsAsRead);

router
  .route('/delete-all')
  .delete(verifyToken, NotificationController.deleteAllNotifications);

router
  .route('/bulk-send')
  .post(verifyToken, requireAdmin, notificationValidations.bulkSend, NotificationController.sendBulkNotifications);

router
  .route('/stats')
  .get(verifyToken, NotificationController.getNotificationStats);

router
  .route('/:id')
  .get(verifyToken, NotificationController.getNotificationById)
  .delete(verifyToken, NotificationController.deleteNotification);

router
  .route('/:id/read')
  .put(verifyToken, NotificationController.markNotificationAsRead);

module.exports = router;
