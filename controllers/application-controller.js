const Application = require('../models/Application');
const Job = require('../models/Job');

class ApplicationController {
  // @desc    Get all applications
  // @route   GET /api/applications
  // @access  Private (Admin)
  static async getAllApplications(req, res) {
    try {
      const applications = await Application.find()
        .populate('job', 'title company')
        .populate('applicant', 'name email');
      res.status(200).json({
        success: true,
        count: applications.length,
        data: applications
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Get applications for a specific job
  // @route   GET /api/jobs/:jobId/applications
  // @access  Private (Employer/Admin)
  static async getJobApplications(req, res) {
    try {
      const applications = await Application.find({ job: req.params.jobId })
        .populate('applicant', 'name email');
      res.status(200).json({
        success: true,
        count: applications.length,
        data: applications
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Apply for a job
  // @route   POST /api/jobs/:jobId/applications
  // @access  Private (Jobseeker)
  static async applyForJob(req, res) {
    try {
      const { coverLetter, expectedSalary, availableFrom, additionalInfo } = req.body;
      const applicant = req.user.userId;
      const job = req.params.jobId;

      const jobExists = await Job.findById(job);

      if (!jobExists) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      const applicationData = {
        applicant,
        job,
        coverLetter,
        expectedSalary,
        availableFrom,
        additionalInfo,
      };

      if (req.file) {
        applicationData.resume = {
          url: req.file.path,
          original_name: req.file.originalname,
        };
      }

      const application = await Application.create(applicationData);

      res.status(201).json({
        success: true,
        data: application
      });
    } catch (error) {
      console.error('Application submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Update application status
  // @route   PUT /api/applications/:id
  // @access  Private (Employer/Admin)
  static async updateApplicationStatus(req, res) {
    try {
      let application = await Application.findById(req.params.id).populate('job');

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Make sure user is employer for the job or admin
      if (application.job.employer.toString() !== req.user.userId && req.user.role !== 'admin') {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to update this application'
        });
      }

      application = await Application.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });

      res.status(200).json({
        success: true,
        data: application
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Get all applications for an employer
  // @route   GET /api/applications/employer/:employerId
  // @access  Private (Employer)
  static async getApplicationsByEmployer(req, res) {
    try {
      // Find all jobs for the given employer
      const jobs = await Job.find({ employer: req.params.employerId });
      const jobIds = jobs.map(job => job._id);

      // Find all applications for those jobs
      const applications = await Application.find({ job: { $in: jobIds } })
        .populate('job', 'title')
        .populate('applicant', 'name email');

      res.status(200).json({
        success: true,
        count: applications.length,
        data: applications
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }
}

module.exports = ApplicationController;
