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
            return res.status(404).json({ msg: 'Employer not found with this email' });
        }

        // Create job with employer ID and set status to approved by default
        const job = await Job.create({
            ...jobData,
            employer: employer._id,
            status: 'approved'
        });

        // Populate employer info for response
        await job.populate('employer', 'name email');

        res.status(201).json(job);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ msg: errors.join(', ') });
        }
        res.status(500).send('Server Error');
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
