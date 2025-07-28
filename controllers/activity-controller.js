const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Article = require('../models/Article');

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
}

module.exports = ActivityController;
