const Notification = require('../models/Notification');

class NotificationService {
  // Create a notification for job application received
  static async createApplicationReceivedNotification(application) {
    try {
      const job = await require('../models/Job').findById(application.job).populate('employer');
      
      await Notification.createNotification({
        recipient: job.employer._id,
        type: 'application_received',
        title: 'New Job Application',
        message: `You have received a new application for ${job.title}`,
        data: {
          jobId: job._id,
          applicationId: application._id,
          applicantName: application.applicantName
        },
        relatedEntity: {
          entityType: 'Application',
          entityId: application._id
        },
        actionUrl: `/employer/applications/${application._id}`,
        actionText: 'View Application',
        priority: 'medium',
        channels: ['in_app', 'email']
      });
    } catch (error) {
      console.error('Error creating application received notification:', error);
    }
  }

  // Create a notification for application status update
  static async createApplicationStatusUpdateNotification(application, oldStatus, newStatus) {
    try {
      const job = await require('../models/Job').findById(application.job);
      
      let title = 'Application Status Updated';
      let message = `Your application for ${job.title} has been ${newStatus}`;
      let priority = 'medium';

      if (newStatus === 'hired') {
        title = 'Congratulations! You\'re Hired!';
        message = `Congratulations! You have been selected for the position of ${job.title}`;
        priority = 'high';
      } else if (newStatus === 'rejected') {
        title = 'Application Update';
        message = `Thank you for your interest in ${job.title}. We have decided to move forward with other candidates.`;
        priority = 'medium';
      } else if (newStatus === 'interview_scheduled') {
        title = 'Interview Scheduled';
        message = `Great news! An interview has been scheduled for your application to ${job.title}`;
        priority = 'high';
      }

      await Notification.createNotification({
        recipient: application.applicant,
        type: 'application_status_update',
        title,
        message,
        data: {
          jobId: job._id,
          applicationId: application._id,
          oldStatus,
          newStatus
        },
        relatedEntity: {
          entityType: 'Application',
          entityId: application._id
        },
        actionUrl: `/jobseeker/applications/${application._id}`,
        actionText: 'View Application',
        priority,
        channels: ['in_app', 'email']
      });
    } catch (error) {
      console.error('Error creating application status update notification:', error);
    }
  }

  // Create a notification for new job posted
  static async createJobPostedNotification(job) {
    try {
      // Get all jobseekers who might be interested
      const User = require('../models/User');
      const Jobseeker = require('../models/Jobseeker');
      
      const jobseekers = await User.find({ role: 'jobseeker', status: 'active' });
      
      for (const jobseeker of jobseekers) {
        const profile = await Jobseeker.findOne({ userId: jobseeker._id });
        
        // Check if jobseeker's skills match job requirements
        let isRelevant = false;
        if (profile && profile.skills && job.requiredSkills) {
          const matchingSkills = profile.skills.filter(skill => 
            job.requiredSkills.some(reqSkill => 
              reqSkill.toLowerCase().includes(skill.toLowerCase())
            )
          );
          isRelevant = matchingSkills.length > 0;
        }

        if (isRelevant) {
          await Notification.createNotification({
            recipient: jobseeker._id,
            type: 'job_recommendation',
            title: 'New Job Recommendation',
            message: `A new job "${job.title}" matches your skills and preferences`,
            data: {
              jobId: job._id,
              company: job.company,
              location: job.location
            },
            relatedEntity: {
              entityType: 'Job',
              entityId: job._id
            },
            actionUrl: `/jobs/${job._id}`,
            actionText: 'View Job',
            priority: 'low',
            channels: ['in_app']
          });
        }
      }
    } catch (error) {
      console.error('Error creating job posted notifications:', error);
    }
  }

  // Create a notification for article published
  static async createArticlePublishedNotification(article) {
    try {
      const User = require('../models/User');
      
      // Notify all active users about new article
      const users = await User.find({ status: 'active' }).select('_id');
      
      for (const user of users) {
        await Notification.createNotification({
          recipient: user._id,
          sender: article.author,
          type: 'article_published',
          title: 'New Article Published',
          message: `New article: "${article.title}" has been published`,
          data: {
            articleId: article._id,
            category: article.category
          },
          relatedEntity: {
            entityType: 'Article',
            entityId: article._id
          },
          actionUrl: `/articles/${article._id}`,
          actionText: 'Read Article',
          priority: 'low',
          channels: ['in_app']
        });
      }
    } catch (error) {
      console.error('Error creating article published notifications:', error);
    }
  }

  // Create a notification for profile viewed
  static async createProfileViewedNotification(viewedUserId, viewerUserId) {
    try {
      const viewer = await require('../models/User').findById(viewerUserId);
      
      await Notification.createNotification({
        recipient: viewedUserId,
        sender: viewerUserId,
        type: 'profile_viewed',
        title: 'Profile Viewed',
        message: `${viewer.name} viewed your profile`,
        data: {
          viewerId: viewerUserId,
          viewerName: viewer.name,
          viewerRole: viewer.role
        },
        actionUrl: `/profile/${viewerUserId}`,
        actionText: 'View Profile',
        priority: 'low',
        channels: ['in_app']
      });
    } catch (error) {
      console.error('Error creating profile viewed notification:', error);
    }
  }

  // Create a system announcement notification
  static async createSystemAnnouncementNotification(title, message, targetUsers = 'all') {
    try {
      const User = require('../models/User');
      
      let users;
      if (targetUsers === 'all') {
        users = await User.find({ status: 'active' }).select('_id');
      } else if (Array.isArray(targetUsers)) {
        users = targetUsers.map(id => ({ _id: id }));
      } else {
        users = await User.find({ role: targetUsers, status: 'active' }).select('_id');
      }
      
      for (const user of users) {
        await Notification.createNotification({
          recipient: user._id,
          type: 'system_announcement',
          title,
          message,
          priority: 'medium',
          channels: ['in_app', 'email'],
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });
      }
    } catch (error) {
      console.error('Error creating system announcement notifications:', error);
    }
  }

  // Create a notification for password changed
  static async createPasswordChangedNotification(userId) {
    try {
      await Notification.createNotification({
        recipient: userId,
        type: 'password_changed',
        title: 'Password Changed',
        message: 'Your password has been successfully changed. If this wasn\'t you, please contact support immediately.',
        priority: 'high',
        channels: ['in_app', 'email']
      });
    } catch (error) {
      console.error('Error creating password changed notification:', error);
    }
  }

  // Create a notification for document uploaded
  static async createDocumentUploadedNotification(userId, documentType) {
    try {
      await Notification.createNotification({
        recipient: userId,
        type: 'document_uploaded',
        title: 'Document Uploaded',
        message: `Your ${documentType} has been successfully uploaded and is being processed.`,
        data: { documentType },
        priority: 'low',
        channels: ['in_app']
      });
    } catch (error) {
      console.error('Error creating document uploaded notification:', error);
    }
  }

  // Create a notification for interview reminder
  static async createInterviewReminderNotification(application, reminderTime = '1 hour') {
    try {
      const job = await require('../models/Job').findById(application.job);
      
      await Notification.createNotification({
        recipient: application.applicant,
        type: 'interview_reminder',
        title: 'Interview Reminder',
        message: `Reminder: You have an interview for ${job.title} in ${reminderTime}`,
        data: {
          jobId: job._id,
          applicationId: application._id,
          reminderTime
        },
        relatedEntity: {
          entityType: 'Application',
          entityId: application._id
        },
        actionUrl: `/jobseeker/applications/${application._id}`,
        actionText: 'View Details',
        priority: 'high',
        channels: ['in_app', 'email']
      });
    } catch (error) {
      console.error('Error creating interview reminder notification:', error);
    }
  }

  // Cleanup old notifications
  static async cleanupOldNotifications() {
    try {
      const result = await Notification.cleanupOldNotifications(30); // 30 days old
      console.log(`Cleaned up ${result.deletedCount} old notifications`);
      return result;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }
}

module.exports = NotificationService;
