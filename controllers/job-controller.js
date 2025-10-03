const Job = require('../models/Job');
const Application = require('../models/Application');
const mongoose = require('mongoose');

class JobController {
  // @desc    Get all jobs
  // @route   GET /api/jobs
  // @access  Public
  static async getAllJobs(req, res) {
    try {
      const {
        search,
        q,
        location,
        jobType,
        experienceLevel,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const queryObject = {};

      // Handle both 'search' and 'q' parameters
      const searchTerm = search || q;
      if (searchTerm && searchTerm.trim()) {
        queryObject.$or = [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { company: { $regex: searchTerm, $options: 'i' } }
        ];
      }

      if (location && location.trim()) {
        queryObject.location = { $regex: location, $options: 'i' };
      }

      if (jobType && jobType.trim()) {
        queryObject.jobType = { $regex: jobType, $options: 'i' };
      }

      if (experienceLevel && experienceLevel.trim()) {
        queryObject.experienceLevel = { $regex: experienceLevel, $options: 'i' };
      }

      // Only show approved (active) jobs in the job portal
      queryObject.status = 'approved';

      // Sorting
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const jobs = await Job.find(queryObject)
        .populate('employer', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Job.countDocuments(queryObject);

      res.status(200).json({
        success: true,
        count: jobs.length,
        total,
        data: jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get all jobs error:', error);
      res.status(500).json({
        success: false,
        message: 'Server Error',
        error: error.message
      });
    }
  }

  // @desc    Get single job
  // @route   GET /api/jobs/:id
  // @access  Public
  static async getJob(req, res) {
    try {
      console.log('🔍 getJob called with ID:', req.params.id);

      const job = await Job.findById(req.params.id).populate('employer', 'name email');
      console.log('🔍 Job found:', job ? 'Yes' : 'No');

      if (!job) {
        console.log('❌ Job not found for ID:', req.params.id);
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      // Only allow access to approved (active) jobs
      if (job.status !== 'approved') {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      console.log('✅ Returning job:', job.title);
      res.status(200).json({
        success: true,
        data: job
      });
    } catch (error) {
      console.error('💥 getJob error:', error);
      res.status(500).json({
        success: false,
        message: 'Server Error',
        error: error.message
      });
    }
  }

  // @desc    Create a job
  // @route   POST /api/jobs
  // @access  Private (Employer)
  static async createJob(req, res) {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to create a job'
        });
      }

      // Set employer from authenticated user
      const employerId = req.user.userId;
      req.body.employer = employerId;

      // Set default status (model allows 'approved', 'pending', or 'inactive')
      req.body.status = 'approved';

      // console.log('Creating job with employer ID:', employerId);
      // console.log('Job data:', JSON.stringify(req.body, null, 2));

      const job = await Job.create(req.body);
      // console.log('Job created successfully:', job._id);

      res.status(201).json({
        success: true,
        data: job,
        message: 'Job created successfully'
      });
    } catch (error) {
      console.error('Create job error:', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      // Handle duplicate key errors
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate field value entered'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Server Error',
        error: error.message
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
      const userId = req.user.userId || req.user.id;
      console.log(`User ID: ${userId}`);
      console.log(`Job Employer ID: ${job.employer.toString()}`);
      if (job.employer.toString() !== userId && req.user.role !== 'admin') {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to delete this job'
        });
      }

      await Job.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        data: {},
        message: 'Job deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Get all jobs for a specific employer with application counts
  // @route   GET /api/jobs/employer/:employerId
  // @access  Public
  static async getJobsByEmployer(req, res) {
    try {
      const employerId = new mongoose.Types.ObjectId(req.params.employerId);

      const jobs = await Job.aggregate([
        {
          $match: { employer: employerId }
        },
        {
          $lookup: {
            from: 'applications',
            localField: '_id',
            foreignField: 'job',
            as: 'applications'
          }
        },
        {
          $addFields: {
            applicationCount: { $size: '$applications' }
          }
        },
        {
          $project: {
            applications: 0 // Exclude the applications array from the final output
          }
        }
      ]);

      // The aggregation pipeline returns plain objects, so if you need to populate employer details,
      // you might need a separate query or a different approach.
      // For this case, we'll manually populate employer details for simplicity.
      const populatedJobs = await Job.populate(jobs, { path: 'employer', select: 'name email' });

      res.status(200).json({
        success: true,
        count: populatedJobs.length,
        data: populatedJobs
      });
    } catch (error) {
      console.error('Error fetching jobs by employer:', error);
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }
}

module.exports = JobController;