const Job = require('../models/Job');

class JobController {
  // @desc    Get all jobs
  // @route   GET /api/jobs
  // @access  Public
  static async getAllJobs(req, res) {
    try {
      const { search, location, jobType } = req.query;
      const queryObject = {};

      if (search) {
        queryObject.title = { $regex: search, $options: 'i' };
      }

      if (location) {
        queryObject.location = { $regex: location, $options: 'i' };
      }

      if (jobType) {
        queryObject.jobType = jobType;
      }

      const jobs = await Job.find(queryObject).populate('employer', 'name email');
      res.status(200).json({
        success: true,
        count: jobs.length,
        data: jobs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Get single job
  // @route   GET /api/jobs/:id
  // @access  Public
  static async getJob(req, res) {
    try {
      const job = await Job.findById(req.params.id).populate('employer', 'name email');

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      res.status(200).json({
        success: true,
        data: job
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Create a job
  // @route   POST /api/jobs
  // @access  Private (Employer)
  static async createJob(req, res) {
    try {
      req.body.employer = req.user.userId;
      const job = await Job.create(req.body);
      res.status(201).json({
        success: true,
        data: job
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Update a job
  // @route   PUT /api/jobs/:id
  // @access  Private (Employer/Admin)
  static async updateJob(req, res) {
    try {
      let job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      // Make sure user is job owner or admin
      if (job.employer.toString() !== req.user.userId && req.user.role !== 'admin') {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to update this job'
        });
      }

      job = await Job.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });

      res.status(200).json({
        success: true,
        data: job
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Delete a job
  // @route   DELETE /api/jobs/:id
  // @access  Private (Employer/Admin)
  static async deleteJob(req, res) {
    try {
      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      // Make sure user is job owner or admin
      if (job.employer.toString() !== req.user.userId && req.user.role !== 'admin') {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to delete this job'
        });
      }

      await job.remove();

      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Get all jobs for a specific employer
  // @route   GET /api/jobs/employer/:employerId
  // @access  Public
  static async getJobsByEmployer(req, res) {
    try {
      const jobs = await Job.find({ employer: req.params.employerId }).populate('employer', 'name email');
      res.status(200).json({
        success: true,
        count: jobs.length,
        data: jobs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }
}

module.exports = JobController;
