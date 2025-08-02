const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Article = require('../models/Article');
const Notification = require('../models/Notification');

class ActivityController {
  // @desc    Get recent activities
  // @route   GET /api/activity
  // @access  Private (Admin)
  static async getRecentActivity(req, res) {
    try {
      const users = await User.find().sort({ createdAt: -1 }).limit(10);
      const jobs = await Job.find().sort({ createdAt: -1 }).limit(10);
      const applications = await Application.find().populate('job', 'title').sort({ createdAt: -1 }).limit(10);
      const articles = await Article.find().sort({ createdAt: -1 }).limit(10);

      const activities = [
        ...users.map(u => ({ type: 'New user registration', date: u.createdAt, details: u.name })),
        ...jobs.map(j => ({ type: 'New job posted', date: j.createdAt, details: j.title })),
        ...applications.map(a => ({ type: 'Job application submitted', date: a.createdAt, details: a.job ? a.job.title : 'N/A' })),
        ...articles.map(art => ({ type: 'New article published', date: art.createdAt, details: art.title })),
      ];

      const sortedActivities = activities.sort((a, b) => new Date(b.date) - new Date(a.date));

      res.status(200).json({
        success: true,
        data: sortedActivities.slice(0, 10)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Get activity by type
  // @route   GET /api/activity/type/:type
  // @access  Private (Admin)
  static async getActivityByType(req, res) {
    try {
      const { type } = req.params;
      const { page = 1, limit = 20 } = req.query;

      let activities = [];

      switch (type) {
        case 'users':
          activities = await User.find()
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
          break;
        case 'jobs':
          activities = await Job.find()
            .populate('employer', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
          break;
        case 'applications':
          activities = await Application.find()
            .populate('job', 'title')
            .populate('applicant', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
          break;
        case 'articles':
          activities = await Article.find()
            .populate('author', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid activity type'
          });
      }

      res.status(200).json({
        success: true,
        data: activities
      });
    } catch (error) {
      console.error('Get activity by type error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activities by type'
      });
    }
  }

  // @desc    Get user activity
  // @route   GET /api/activity/user/:userId
  // @access  Private (Admin)
  static async getUserActivity(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      // Get user's applications
      const applications = await Application.find({ applicant: userId })
        .populate('job', 'title')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Get user's articles (if they're an author)
      const articles = await Article.find({ author: userId })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Get user's jobs (if they're an employer)
      const jobs = await Job.find({ employer: userId })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      res.status(200).json({
        success: true,
        data: {
          applications,
          articles,
          jobs
        }
      });
    } catch (error) {
      console.error('Get user activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user activity'
      });
    }
  }

  // @desc    Get activity statistics
  // @route   GET /api/activity/stats
  // @access  Private (Admin)
  static async getActivityStats(req, res) {
    try {
      const { timeRange = '7d' } = req.query;

      // Calculate date range
      const now = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case '1d':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      const dateFilter = { createdAt: { $gte: startDate } };

      const [
        newUsers,
        newJobs,
        newApplications,
        newArticles
      ] = await Promise.all([
        User.countDocuments(dateFilter),
        Job.countDocuments(dateFilter),
        Application.countDocuments(dateFilter),
        Article.countDocuments(dateFilter)
      ]);

      res.status(200).json({
        success: true,
        data: {
          timeRange,
          stats: {
            newUsers,
            newJobs,
            newApplications,
            newArticles
          }
        }
      });
    } catch (error) {
      console.error('Get activity stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activity statistics'
      });
    }
  }

  // @desc    Get dashboard activity summary
  // @route   GET /api/activity/dashboard-summary
  // @access  Private
  static async getDashboardActivitySummary(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      let summary = {};

      if (userRole === 'admin') {
        // Admin dashboard summary
        const [
          totalUsers,
          totalJobs,
          totalApplications,
          recentNotifications
        ] = await Promise.all([
          User.countDocuments(),
          Job.countDocuments(),
          Application.countDocuments(),
          Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('sender', 'name')
        ]);

        summary = {
          totalUsers,
          totalJobs,
          totalApplications,
          recentNotifications
        };
      } else if (userRole === 'employer') {
        // Employer dashboard summary
        const [
          myJobs,
          totalApplications,
          recentApplications
        ] = await Promise.all([
          Job.countDocuments({ employer: userId }),
          Application.countDocuments({
            job: { $in: await Job.find({ employer: userId }).select('_id') }
          }),
          Application.find({
            job: { $in: await Job.find({ employer: userId }).select('_id') }
          })
            .populate('job', 'title')
            .populate('applicant', 'name')
            .sort({ createdAt: -1 })
            .limit(5)
        ]);

        summary = {
          myJobs,
          totalApplications,
          recentApplications
        };
      } else {
        // Jobseeker dashboard summary
        const [
          myApplications,
          savedJobs,
          recentNotifications
        ] = await Promise.all([
          Application.countDocuments({ applicant: userId }),
          User.findById(userId).select('savedJobs'),
          Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('sender', 'name')
        ]);

        summary = {
          myApplications,
          savedJobs: savedJobs?.savedJobs?.length || 0,
          recentNotifications
        };
      }

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Get dashboard activity summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard summary'
      });
    }
  }
}

module.exports = ActivityController;
