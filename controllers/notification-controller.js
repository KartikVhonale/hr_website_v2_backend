const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationController {
  // @desc    Get user notifications
  // @route   GET /api/notifications
  // @access  Private
  static async getUserNotifications(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        type,
        priority,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = { recipient: req.user.id };

      // Add filters
      if (status) query.status = status;
      if (type) query.type = type;
      if (priority) query.priority = priority;
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const notifications = await Notification.find(query)
        .populate('sender', 'name email profilePicture')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await Notification.countDocuments(query);

      res.status(200).json({
        success: true,
        data: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get user notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications'
      });
    }
  }

  // @desc    Get notification by ID
  // @route   GET /api/notifications/:id
  // @access  Private
  static async getNotificationById(req, res) {
    try {
      const notification = await Notification.findOne({
        _id: req.params.id,
        recipient: req.user.id
      }).populate('sender', 'name email profilePicture');

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.status(200).json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error('Get notification by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notification'
      });
    }
  }

  // @desc    Mark notification as read
  // @route   PUT /api/notifications/:id/read
  // @access  Private
  static async markNotificationAsRead(req, res) {
    try {
      const notification = await Notification.findOne({
        _id: req.params.id,
        recipient: req.user.id
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      await notification.markAsRead();

      res.status(200).json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read'
      });
    }
  }

  // @desc    Mark all notifications as read
  // @route   PUT /api/notifications/mark-all-read
  // @access  Private
  static async markAllNotificationsAsRead(req, res) {
    try {
      await Notification.markAllAsRead(req.user.id);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read'
      });
    }
  }

  // @desc    Delete notification
  // @route   DELETE /api/notifications/:id
  // @access  Private
  static async deleteNotification(req, res) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        recipient: req.user.id
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification'
      });
    }
  }

  // @desc    Delete all notifications
  // @route   DELETE /api/notifications/delete-all
  // @access  Private
  static async deleteAllNotifications(req, res) {
    try {
      await Notification.deleteMany({ recipient: req.user.id });

      res.status(200).json({
        success: true,
        message: 'All notifications deleted successfully'
      });
    } catch (error) {
      console.error('Delete all notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete all notifications'
      });
    }
  }

  // @desc    Get unread notification count
  // @route   GET /api/notifications/unread-count
  // @access  Private
  static async getUnreadNotificationCount(req, res) {
    try {
      const count = await Notification.getUnreadCount(req.user.id);

      res.status(200).json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('Get unread notification count error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unread notification count'
      });
    }
  }

  // @desc    Create notification (Admin/System)
  // @route   POST /api/notifications
  // @access  Private (Admin)
  static async createNotification(req, res) {
    try {
      const {
        recipients,
        type,
        title,
        message,
        data,
        priority,
        actionUrl,
        actionText,
        expiresAt,
        channels
      } = req.body;

      // Handle single recipient or multiple recipients
      const recipientIds = Array.isArray(recipients) ? recipients : [recipients];
      
      const notifications = [];
      
      for (const recipientId of recipientIds) {
        const notification = await Notification.createNotification({
          recipient: recipientId,
          sender: req.user.id,
          type,
          title,
          message,
          data,
          priority,
          actionUrl,
          actionText,
          expiresAt,
          channels,
          metadata: {
            source: 'admin',
            category: 'manual'
          }
        });
        notifications.push(notification);
      }

      res.status(201).json({
        success: true,
        message: `${notifications.length} notification(s) created successfully`,
        data: notifications
      });
    } catch (error) {
      console.error('Create notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create notification'
      });
    }
  }

  // @desc    Send bulk notifications
  // @route   POST /api/notifications/bulk-send
  // @access  Private (Admin)
  static async sendBulkNotifications(req, res) {
    try {
      const {
        userFilters,
        type,
        title,
        message,
        data,
        priority,
        actionUrl,
        actionText,
        expiresAt,
        channels
      } = req.body;

      // Build user query based on filters
      const userQuery = {};
      if (userFilters.role) userQuery.role = userFilters.role;
      if (userFilters.status) userQuery.status = userFilters.status;
      if (userFilters.isAuthorized !== undefined) userQuery.isAuthorized = userFilters.isAuthorized;

      const users = await User.find(userQuery).select('_id');
      const recipientIds = users.map(user => user._id);

      const notifications = [];
      
      for (const recipientId of recipientIds) {
        const notification = await Notification.createNotification({
          recipient: recipientId,
          sender: req.user.id,
          type,
          title,
          message,
          data,
          priority,
          actionUrl,
          actionText,
          expiresAt,
          channels,
          metadata: {
            source: 'admin',
            category: 'bulk'
          }
        });
        notifications.push(notification);
      }

      res.status(201).json({
        success: true,
        message: `${notifications.length} bulk notification(s) sent successfully`,
        data: { count: notifications.length }
      });
    } catch (error) {
      console.error('Send bulk notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send bulk notifications'
      });
    }
  }

  // @desc    Get notification statistics
  // @route   GET /api/notifications/stats
  // @access  Private
  static async getNotificationStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await Notification.aggregate([
        { $match: { recipient: userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const typeStats = await Notification.aggregate([
        { $match: { recipient: userId } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]);

      const formattedStats = {
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        byType: typeStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      };

      res.status(200).json({
        success: true,
        data: formattedStats
      });
    } catch (error) {
      console.error('Get notification stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification statistics'
      });
    }
  }
}

module.exports = NotificationController;
