const Job = require('../models/Job');
const User = require('../models/User');

// @desc    Get all jobs
// @route   GET /api/admin/jobs
// @access  Private (Admin)
const getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.find().populate('employer', 'name email');
        res.json(jobs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get job by ID
// @route   GET /api/admin/jobs/:id
// @access  Private (Admin)
const getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('employer', 'name email');
        if (!job) {
            return res.status(404).json({ msg: 'Job not found' });
        }
        res.json(job);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update a job
// @route   PUT /api/admin/jobs/:id
// @access  Private (Admin)
const updateJob = async (req, res) => {
    try {
        let job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ msg: 'Job not found' });
        }

        job = await Job.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });

        res.json(job);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Create a job (Admin)
// @route   POST /api/admin/jobs
// @access  Private (Admin)
const createJob = async (req, res) => {
    try {
        const { employerEmail, ...jobData } = req.body;

        // Find employer by email
        const employer = await User.findOne({ email: employerEmail, role: 'employer' });

        if (!employer) {
            return res.status(404).json({
                success: false,
                message: 'Employer not found with this email'
            });
        }

        // Clean up the job data
        // If salary is empty string or not provided, use CTC value
        if (!jobData.salary || jobData.salary.trim() === '') {
            jobData.salary = jobData.ctc || '';
        }

        // Remove empty string fields that might cause validation issues
        Object.keys(jobData).forEach(key => {
            if (jobData[key] === '') {
                delete jobData[key];
            }
        });

        console.log('Admin creating job with data:', jobData);

        // Create job with employer ID and set status to approved by default
        const job = await Job.create({
            ...jobData,
            employer: employer._id,
            status: 'approved'
        });

        // Populate employer info for response
        await job.populate('employer', 'name email');

        res.status(201).json({
            success: true,
            data: job,
            message: 'Job created successfully'
        });
    } catch (err) {
        console.error('Admin create job error:', err);

        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(error => ({
                field: error.path,
                message: error.message,
                value: error.value
            }));
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};

// @desc    Delete a job
// @route   DELETE /api/admin/jobs/:id
// @access  Private (Admin)
const deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ msg: 'Job not found' });
        }

        await job.remove();

        res.json({ msg: 'Job removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getAllJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
};
