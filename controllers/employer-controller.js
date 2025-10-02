const User = require('../models/User');
const Employer = require('../models/Employer');
const Jobseeker = require('../models/Jobseeker');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Article = require('../models/Article');

// @desc    Get employer profile
// @route   GET /api/employer/profile
// @access  Private (Employer)
const getEmployerProfile = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const user = await User.findById(userId).select('-password');

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        console.error('Get employer profile error:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Update employer profile
// @route   PUT /api/employer/profile
// @access  Private (Employer)
const updateEmployerProfile = async (req, res) => {
    const { name, email, phone, company } = req.body;

    const profileFields = { name, email, phone, company };

    try {
        const userId = req.user.userId || req.user.id;
        let user = await User.findById(userId);

        if (user) {
            // Update
            user = await User.findByIdAndUpdate(
                userId,
                { $set: profileFields },
                { new: true }
            );
            return res.status(200).json({
                success: true,
                data: user
            });
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
        const employerId = req.user.userId || req.user.id;
        console.log('Fetching jobs for employer ID:', employerId);

        const jobs = await Job.find({ employer: employerId }).sort({ createdAt: -1 });
        console.log('Found jobs:', jobs.length);

        res.status(200).json({
            success: true,
            count: jobs.length,
            data: jobs
        });
    } catch (err) {
        console.error('Get posted jobs error:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Get all applications for an employer
// @route   GET /api/employer/applications
// @access  Private (Employer)
const getAllApplications = async (req, res) => {
    try {
        const employerId = req.user.userId || req.user.id;
        
        // First get all jobs posted by this employer
        const employerJobs = await Job.find({ employer: employerId }).select('_id');
        const jobIds = employerJobs.map(job => job._id);
        
        // Then get all applications for those jobs
        const applications = await Application.find({ job: { $in: jobIds } })
            .populate({
                path: 'job',
                select: 'title company location'
            })
            .populate({
                path: 'applicant',
                select: 'name email phone profileImage skills'
            })
            .sort({ createdAt: -1 });
            
        res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });
    } catch (err) {
        console.error('Get all applications error:', err.message);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
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

    // No mapping needed anymore since frontend and backend use the same status values
    const mappedStatus = status;

    try {
        // Use findByIdAndUpdate to only update the status field and bypass validation
        let application = await Application.findByIdAndUpdate(
            req.params.applicationId,
            { status: mappedStatus },
            { new: true, runValidators: false } // runValidators: false bypasses validation
        )
        .populate({
            path: 'job',
            select: 'title company location employer'
        })
        .populate({
            path: 'applicant',
            select: 'name email phone profileImage skills'
        });

        if (!application) {
            // console.log('Application not found:', req.params.applicationId);
            return res.status(404).json({ msg: 'Application not found' });
        }
        
        // Check to ensure the employer owns the job associated with the application
        const employerId = req.user.userId || req.user.id;
        
        // Since we've populated the job, we can use job.employer directly
        // console.log('Found job:', application.job._id, 'with employer:', application.job.employer);

        // console.log('Authorization failed. Job employer:', application.job.employer, 'User ID:', employerId);
        if (application.job.employer.toString() !== employerId.toString()) {
            return res.status(403).json({ msg: 'User not authorized to update this application' });
        }

        // console.log('Application status updated successfully:', application._id, 'to', mappedStatus);
        res.json(application);
    } catch (err) {
        console.error('Error updating application status:', err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get saved candidates
// @route   GET /api/employer/saved-candidates
// @access  Private (Employer)
const getSavedCandidates = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const employer = await Employer.findOne({ userId: userId }).populate({
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
        const userId = req.user.userId || req.user.id;
        const employer = await Employer.findOne({ userId: userId });
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
        const userId = req.user.userId || req.user.id;
        const employer = await Employer.findOne({ userId: userId });

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


// @desc    Get employer dashboard data
// @route   GET /api/employer/dashboard
// @access  Private (Employer)
const getDashboardData = async (req, res) => {
    try {
        const employerId = req.user.userId || req.user.id;

        // OPTIMIZED: Single query to get all employer jobs first
        const employerJobs = await Job.find({ employer: employerId })
            .select('_id title status createdAt')
            .sort({ createdAt: -1 });

        const jobIds = employerJobs.map(job => job._id);

        // OPTIMIZED: Parallel execution with reduced queries
        const [
            applications,
            savedCandidatesData,
            articles
        ] = await Promise.all([
            // Get all applications for employer's jobs
            Application.find({ job: { $in: jobIds } })
                .populate('job', 'title')
                .populate('applicant', 'name email')
                .sort({ createdAt: -1 }),

            // Get employer profile with saved candidates
            Employer.findOne({ userId: employerId })
                .populate({
                    path: 'savedCandidates',
                    select: 'name email jobTitle',
                    options: { limit: 5 }
                }),

            // Get recent articles if employer is also an author
            Article.find({ author: employerId })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('title createdAt status')
        ]);

        // Calculate stats from fetched data (no additional DB queries)
        const stats = {
            totalJobs: employerJobs.length,
            activeJobs: employerJobs.filter(job => job.status === 'approved').length,
            pendingJobs: employerJobs.filter(job => job.status === 'pending').length,
            totalApplications: applications.length,
            savedCandidates: savedCandidatesData?.savedCandidates?.length || 0,
            recentApplications: applications.filter(app => {
                const dayAgo = new Date();
                dayAgo.setDate(dayAgo.getDate() - 1);
                return new Date(app.createdAt) > dayAgo;
            }).length
        };

        // Comprehensive dashboard data in single response
        const dashboardData = {
            stats,
            recentJobs: employerJobs.slice(0, 5),
            recentApplications: applications.slice(0, 5),
            savedCandidates: savedCandidatesData?.savedCandidates || [],
            recentArticles: articles || []
        };

        res.status(200).json({
            success: true,
            data: dashboardData,
            message: 'Dashboard data retrieved successfully'
        });
    } catch (error) {
        console.error('Get employer dashboard data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data'
        });
    }
};

// @desc    Get employer statistics
// @route   GET /api/employer/stats
// @access  Private (Employer)
const getEmployerStats = async (req, res) => {
    try {
        const employerId = req.user.userId || req.user.id;

        const [
            totalJobs,
            activeJobs,
            expiredJobs,
            totalApplications,
            pendingApplications,
            reviewedApplications,
            hiredApplications
        ] = await Promise.all([
            Job.countDocuments({ employer: employerId }),
            Job.countDocuments({ employer: employerId, status: 'active' }),
            Job.countDocuments({ employer: employerId, status: 'expired' }),
            Application.countDocuments({
                job: { $in: await Job.find({ employer: employerId }).select('_id') }
            }),
            Application.countDocuments({
                job: { $in: await Job.find({ employer: employerId }).select('_id') },
                status: 'pending'
            }),
            Application.countDocuments({
                job: { $in: await Job.find({ employer: employerId }).select('_id') },
                status: 'reviewed'
            }),
            Application.countDocuments({
                job: { $in: await Job.find({ employer: employerId }).select('_id') },
                status: 'hired'
            })
        ]);

        res.status(200).json({
            success: true,
            data: {
                jobs: {
                    total: totalJobs,
                    active: activeJobs,
                    expired: expiredJobs
                },
                applications: {
                    total: totalApplications,
                    pending: pendingApplications,
                    reviewed: reviewedApplications,
                    hired: hiredApplications
                }
            }
        });
    } catch (error) {
        console.error('Get employer stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employer statistics'
        });
    }
};

// @desc    Search candidates
// @route   GET /api/employer/candidates
// @access  Private (Employer)
const searchCandidates = async (req, res) => {
    try {
        const {
            q = '',
            skills,
            experience,
            location,
            education,
            page = 1,
            limit = 10,
            sortBy = 'relevance',
            sortOrder = 'desc'
        } = req.query;

        // Build aggregation pipeline
        const pipeline = [
            {
                $lookup: {
                    from: 'jobseekers',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'jobseekerProfile'
                }
            },
            {
                $match: {
                    role: 'jobseeker',
                    status: 'active',
                    jobseekerProfile: { $ne: [] }
                }
            }
        ];

        // Add search filters
        const matchConditions = {};

        if (q) {
            matchConditions.$or = [
                { name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { 'jobseekerProfile.jobTitle': { $regex: q, $options: 'i' } }
            ];
        }

        if (skills) {
            const skillsArray = skills.split(',');
            matchConditions['jobseekerProfile.skills'] = { $in: skillsArray };
        }

        if (location) {
            matchConditions['jobseekerProfile.location'] = { $regex: location, $options: 'i' };
        }

        if (experience) {
            matchConditions['jobseekerProfile.experience'] = { $exists: true, $ne: [] };
        }

        if (education) {
            matchConditions['jobseekerProfile.education'] = { $exists: true, $ne: [] };
        }

        if (Object.keys(matchConditions).length > 0) {
            pipeline.push({ $match: matchConditions });
        }

        // Add sorting
        const sortOptions = {};
        if (sortBy === 'relevance') {
            sortOptions.createdAt = -1;
        } else {
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        }
        pipeline.push({ $sort: sortOptions });

        // Add pagination
        pipeline.push({ $skip: (page - 1) * limit });
        pipeline.push({ $limit: parseInt(limit) });

        // Project fields
        pipeline.push({
            $project: {
                name: 1,
                email: 1,
                profilePicture: 1,
                createdAt: 1,
                jobseekerProfile: 1
            }
        });

        const candidates = await User.aggregate(pipeline);

        // Get total count for pagination
        const countPipeline = pipeline.slice(0, -3); // Remove sort, skip, limit, project
        countPipeline.push({ $count: 'total' });
        const countResult = await User.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        res.status(200).json({
            success: true,
            data: candidates,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Search candidates error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search candidates'
        });
    }
};

module.exports = {
    getEmployerProfile,
    updateEmployerProfile,
    getPostedJobs,
    getApplicationsForJob,
    getAllApplications,
    updateApplicationStatus,
    getSavedCandidates,
    saveCandidate,
    unsaveCandidate,
    getDashboardData,
    getEmployerStats,
    searchCandidates
};
