const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
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
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Additional data related to the notification
    default: {}
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['Job', 'Application', 'Article', 'User', 'Team', 'Contact']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  },
  readAt: {
    type: Date
  },
  actionUrl: {
    type: String // URL to navigate when notification is clicked
  },
  actionText: {
    type: String // Text for action button
  },
  expiresAt: {
    type: Date // Optional expiration date for the notification
  },
  channels: [{
    type: String,
    enum: ['in_app', 'email', 'sms', 'push'],
    default: 'in_app'
  }],
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  },
  pushSent: {
    type: Boolean,
    default: false
  },
  pushSentAt: {
    type: Date
  },
  smsSent: {
    type: Boolean,
    default: false
  },
  smsSentAt: {
    type: Date
  },
  metadata: {
    source: {
      type: String, // Source of the notification (e.g., 'system', 'user_action', 'scheduled')
      default: 'system'
    },
    category: {
      type: String // Category for grouping notifications
    },
    tags: [String], // Tags for filtering and searching
    version: {
      type: String,
      default: '1.0'
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
NotificationSchema.index({ recipient: 1, status: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ status: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
NotificationSchema.index({ 'relatedEntity.entityType': 1, 'relatedEntity.entityId': 1 });

// Virtual for checking if notification is expired
NotificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for time since creation
NotificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Method to mark as read
NotificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

// Method to mark as archived
NotificationSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Static method to create notification
NotificationSchema.statics.createNotification = async function(notificationData) {
  const notification = new this(notificationData);
  return await notification.save();
};

// Static method to get unread count for user
NotificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    recipient: userId,
    status: 'unread',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to mark all as read for user
NotificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { recipient: userId, status: 'unread' },
    { 
      status: 'read', 
      readAt: new Date() 
    }
  );
};

// Static method to delete old notifications
NotificationSchema.statics.cleanupOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: { $in: ['read', 'archived'] }
  });
};

// Pre-save middleware to set default expiration
NotificationSchema.pre('save', function(next) {
  // Set default expiration for certain types of notifications
  if (!this.expiresAt && this.type === 'system_announcement') {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30); // 30 days
    this.expiresAt = expirationDate;
  }
  
  next();
});

// Pre-find middleware to exclude expired notifications by default
NotificationSchema.pre(/^find/, function(next) {
  // Only apply this filter if not explicitly querying for expired notifications
  if (!this.getQuery().includeExpired) {
    this.where({
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    });
  }
  next();
});

module.exports = mongoose.model('Notification', NotificationSchema);
