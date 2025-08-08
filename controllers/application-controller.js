const Application = require('../models/Application');
const Job = require('../models/Job');
const Jobseeker = require('../models/Jobseeker');

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
      const userId = req.user.userId;
      const { jobId } = req.params;

      let jobseeker = await Jobseeker.findOne({ userId: userId });
      if (!jobseeker) {
        jobseeker = new Jobseeker({ userId: userId });
        await jobseeker.save();
      }

      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }

      const applicationData = {
        applicant: userId,
        job: jobId,
        employer: job.employer,
        coverLetter,
        expectedSalary,
        availableFrom,
        additionalInfo,
      };

      if (req.file) {
        applicationData.resume = {
          url: req.file.path, // Cloudinary URL
          original_name: req.file.originalname,
        };
      } else if (jobseeker.resume && jobseeker.resume.url) {
        applicationData.resume = {
          url: jobseeker.resume.url,
          original_name: jobseeker.resume.original_name,
        };
      }

      if (!applicationData.resume) {
        return res.status(400).json({
            success: false,
            message: 'A resume is required to apply for this job.'
        });
      }

      const application = await Application.create(applicationData);

      jobseeker.applications.push(application._id);
      await jobseeker.save();

      res.status(201).json({
        success: true,
        data: application
      });
    } catch (error) {
      console.error('Application submission error:', error);
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({
          success: false,
          message: messages.join('. ')
        });
      }
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred. Please try again.'
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
