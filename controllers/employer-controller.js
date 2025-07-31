const User = require('../models/User');
const Employer = require('../models/Employer');
const Jobseeker = require('../models/Jobseeker');
const Job = require('../models/Job');
const Application = require('../models/Application');

// @desc    Get employer profile
// @route   GET /api/employer/profile
// @access  Private (Employer)
const getEmployerProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update employer profile
// @route   PUT /api/employer/profile
// @access  Private (Employer)
const updateEmployerProfile = async (req, res) => {
    const { name, email, phone, company } = req.body;

    const profileFields = { name, email, phone, company };

    try {
        let user = await User.findById(req.user.id);

        if (user) {
            // Update
            user = await User.findByIdAndUpdate(
                req.user.id,
                { $set: profileFields },
                { new: true }
            );
            return res.json(user);
        }

        res.status(404).json({ msg: 'User not found' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all jobs posted by an employer
// @route   GET /api/employer/jobs
// @access  Private (Employer)
const getPostedJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ employer: req.user.id });
        res.json(jobs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all applications for a specific job
// @route   GET /api/employer/jobs/:jobId/applications
// @access  Private (Employer)
const getApplicationsForJob = async (req, res) => {
    try {
        const applications = await Application.find({ job: req.params.jobId }).populate('applicant', 'name email skills');
        res.json(applications);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update application status
// @route   PUT /api/employer/applications/:applicationId
// @access  Private (Employer)
const updateApplicationStatus = async (req, res) => {
    const { status } = req.body;

    try {
        let application = await Application.findById(req.params.applicationId);

        if (!application) {
            return res.status(404).json({ msg: 'Application not found' });
        }

        // TODO: Add check to ensure the employer owns the job associated with the application

        application.status = status;
        await application.save();

        res.json(application);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get saved candidates
// @route   GET /api/employer/saved-candidates
// @access  Private (Employer)
const getSavedCandidates = async (req, res) => {
    try {
        const employer = await Employer.findOne({ userId: req.user.id }).populate({
            path: 'savedCandidates',
            populate: {
                path: 'userId',
                select: 'name email'
            }
        });

        if (!employer) {
            return res.status(404).json({ message: 'Employer profile not found' });
        }

        const candidatesWithDetails = employer.savedCandidates.map(candidate => ({
            _id: candidate._id,
            name: candidate.userId?.name || 'Unknown',
            email: candidate.userId?.email || 'Unknown',
            jobTitle: candidate.jobTitle,
            skills: candidate.skills,
            location: candidate.location
        }));

        res.json(candidatesWithDetails);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Save a candidate
// @route   POST /api/employer/saved-candidates/:candidateId
// @access  Private (Employer)
const saveCandidate = async (req, res) => {
    try {
        const employer = await Employer.findOne({ userId: req.user.id });
        const jobseeker = await Jobseeker.findById(req.params.candidateId);

        if (!jobseeker) {
            return res.status(404).json({ msg: 'Candidate not found' });
        }

        if (!employer) {
            return res.status(404).json({ msg: 'Employer profile not found' });
        }

        if (employer.savedCandidates.includes(req.params.candidateId)) {
            return res.status(400).json({ msg: 'Candidate already saved' });
        }

        employer.savedCandidates.push(req.params.candidateId);
        await employer.save();

        res.json({ success: true, message: 'Candidate saved successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Unsave a candidate
// @route   DELETE /api/employer/saved-candidates/:candidateId
// @access  Private (Employer)
const unsaveCandidate = async (req, res) => {
    try {
        const employer = await Employer.findOne({ userId: req.user.id });

        if (!employer) {
            return res.status(404).json({ msg: 'Employer profile not found' });
        }

        if (!employer.savedCandidates.includes(req.params.candidateId)) {
            return res.status(400).json({ msg: 'Candidate not saved' });
        }

        employer.savedCandidates = employer.savedCandidates.filter(
            (candidateId) => candidateId.toString() !== req.params.candidateId
        );
        await employer.save();

        res.json({ success: true, message: 'Candidate removed from saved list' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


module.exports = {
    getEmployerProfile,
    updateEmployerProfile,
    getPostedJobs,
    getApplicationsForJob,
    updateApplicationStatus,
    getSavedCandidates,
    saveCandidate,
    unsaveCandidate,
};
