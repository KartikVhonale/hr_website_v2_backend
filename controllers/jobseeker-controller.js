const User = require('../models/User');
const Jobseeker = require('../models/Jobseeker');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Notification = require('../models/Notification');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get jobseeker profile
// @route   GET /api/jobseeker/profile
// @access  Private
const getJobseekerProfile = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        // Get basic user info
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                msg: 'User not found'
            });
        }

        // Get jobseeker profile or create if doesn't exist
        let jobseekerProfile = await Jobseeker.findOne({ userId });
        if (!jobseekerProfile) {
            jobseekerProfile = new Jobseeker({
                userId,
                skills: [],
                experience: [],
                education: [],
                certifications: [],
                socialLinks: {},
                savedJobs: []
            });
            await jobseekerProfile.save();
        }

        // Auto-migrate resume URL from raw to image format if needed
        if (jobseekerProfile.resume && jobseekerProfile.resume.url) {
            if (jobseekerProfile.resume.url.includes('/raw/upload/')) {
                const oldUrl = jobseekerProfile.resume.url;
                const newUrl = oldUrl.replace('/raw/upload/', '/image/upload/');
                jobseekerProfile.resume.url = newUrl;
                await jobseekerProfile.save();
            }
        }

        // Combine user and jobseeker data - NEW FORMAT ONLY
        const profileData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            profilePicture: user.profilePicture,
            // Jobseeker profile data
            phone: jobseekerProfile.phone,
            location: jobseekerProfile.location,
            jobTitle: jobseekerProfile.jobTitle,
            summary: jobseekerProfile.summary,
            skills: jobseekerProfile.skills,
            experience: jobseekerProfile.experience,
            education: jobseekerProfile.education,
            certifications: jobseekerProfile.certifications,
            resume: jobseekerProfile.resume,
            savedJobs: jobseekerProfile.savedJobs,
            profileCompletion: jobseekerProfile.profileCompletion,
            // Social links - NEW FORMAT ONLY
            linkedin: jobseekerProfile.socialLinks?.linkedin,
            github: jobseekerProfile.socialLinks?.github,
            portfolio: jobseekerProfile.socialLinks?.portfolio,
            socialLinks: jobseekerProfile.socialLinks
        };

        res.json({
            success: true,
            data: profileData
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            msg: 'Server Error'
        });
    }
};

// @desc    Update jobseeker profile
// @route   PUT /api/jobseeker/profile
// @access  Private
const updateJobseekerProfile = async (req, res) => {
    const {
        name,
        email,
        phone,
        location,
        jobTitle,
        summary,
        skills,
        experience,
        education,
        certifications,
        linkedin,
        github,
        portfolio,
        resume,
    } = req.body;

    const userId = req.user.userId || req.user.id;

    // Separate user fields from jobseeker fields
    const userFields = {};
    const jobseekerFields = {};

    // User table fields
    if (name !== undefined) userFields.name = name;
    if (email !== undefined) userFields.email = email;

    // Jobseeker table fields
    if (phone !== undefined) jobseekerFields.phone = phone;
    if (location !== undefined) jobseekerFields.location = location;
    if (jobTitle !== undefined) jobseekerFields.jobTitle = jobTitle;
    if (summary !== undefined) jobseekerFields.summary = summary;
    if (skills !== undefined) jobseekerFields.skills = skills;
    if (experience !== undefined) jobseekerFields.experience = experience;
    if (education !== undefined) jobseekerFields.education = education;
    if (certifications !== undefined) jobseekerFields.certifications = certifications;
    if (resume !== undefined) jobseekerFields.resume = resume;

    // Social links - NEW FORMAT ONLY
    if (linkedin !== undefined || github !== undefined || portfolio !== undefined) {
        // Get existing social links or create new object
        jobseekerFields.socialLinks = {};
        if (linkedin !== undefined) jobseekerFields.socialLinks.linkedin = linkedin;
        if (github !== undefined) jobseekerFields.socialLinks.github = github;
        if (portfolio !== undefined) jobseekerFields.socialLinks.portfolio = portfolio;
    }

    try {
        // Update user basic info if provided
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                msg: 'User not found'
            });
        }

        if (Object.keys(userFields).length > 0) {
            user = await User.findByIdAndUpdate(
                userId,
                { $set: userFields },
                { new: true, runValidators: true }
            ).select('-password');
        }

        // Update or create jobseeker profile
        let jobseekerProfile = await Jobseeker.findOne({ userId });
        if (!jobseekerProfile) {
            jobseekerProfile = new Jobseeker({
                userId,
                ...jobseekerFields
            });
        } else {
            Object.assign(jobseekerProfile, jobseekerFields);
        }

        await jobseekerProfile.save();

        // Combine user and jobseeker data for response - NEW FORMAT ONLY
        const profileData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            profilePicture: user.profilePicture,
            // Jobseeker profile data
            phone: jobseekerProfile.phone,
            location: jobseekerProfile.location,
            jobTitle: jobseekerProfile.jobTitle,
            summary: jobseekerProfile.summary,
            skills: jobseekerProfile.skills,
            experience: jobseekerProfile.experience,
            education: jobseekerProfile.education,
            certifications: jobseekerProfile.certifications,
            resume: jobseekerProfile.resume,
            savedJobs: jobseekerProfile.savedJobs,
            profileCompletion: jobseekerProfile.profileCompletion,
            // Social links - NEW FORMAT ONLY
            linkedin: jobseekerProfile.socialLinks?.linkedin,
            github: jobseekerProfile.socialLinks?.github,
            portfolio: jobseekerProfile.socialLinks?.portfolio,
            socialLinks: jobseekerProfile.socialLinks
        };

        res.json({
            success: true,
            data: profileData
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get saved jobs
// @route   GET /api/jobseeker/saved-jobs
// @access  Private
const getSavedJobs = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        const jobseekerProfile = await Jobseeker.findOne({ userId }).populate({
            path: 'savedJobs',
            match: { status: 'approved' }, // Only show active jobs
            options: { sort: { createdAt: -1 } }
        });

        if (!jobseekerProfile) {
            return res.status(404).json({
                success: false,
                message: 'Jobseeker profile not found'
            });
        }

        res.status(200).json({
            success: true,
            data: jobseekerProfile.savedJobs
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Save a job
// @route   POST /api/jobseeker/saved-jobs/:jobId
// @access  Private
const saveJob = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const { jobId } = req.params;

        // Verify the job exists and is active
        const job = await Job.findOne({ _id: jobId, status: 'approved' });
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found or not active'
            });
        }

        let jobseekerProfile = await Jobseeker.findOne({ userId });
        if (!jobseekerProfile) {
            jobseekerProfile = new Jobseeker({ userId });
        }

        // Check if job is already saved
        if (jobseekerProfile.savedJobs.includes(jobId)) {
            return res.status(400).json({
                success: false,
                message: 'Job already saved'
            });
        }

        jobseekerProfile.savedJobs.push(jobId);
        await jobseekerProfile.save();

        res.status(200).json({
            success: true,
            message: 'Job saved successfully'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Unsave a job
// @route   DELETE /api/jobseeker/saved-jobs/:jobId
// @access  Private
const unsaveJob = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const { jobId } = req.params;

        const jobseekerProfile = await Jobseeker.findOne({ userId });
        if (!jobseekerProfile) {
            return res.status(404).json({
                success: false,
                message: 'Jobseeker profile not found'
            });
        }

        jobseekerProfile.savedJobs = jobseekerProfile.savedJobs.filter(
            id => id.toString() !== jobId.toString()
        );
        await jobseekerProfile.save();

        res.status(200).json({
            success: true,
            message: 'Job unsaved successfully'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get applied jobs
// @route   GET /api/jobseeker/applied-jobs
// @access  Private
const getAppliedJobs = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        const applications = await Application.find({ applicant: userId })
            .populate({
                path: 'job',
                match: { status: 'approved' }, // Only show applications for active jobs
                select: 'title company location ctc jobType createdAt'
            })
            .sort({ createdAt: -1 });

        // Filter out applications where the job is null (inactive jobs)
        const activeApplications = applications.filter(app => app.job !== null);

        res.status(200).json({
            success: true,
            data: activeApplications
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Upload resume
// @route   POST /api/jobseeker/upload-resume
// @access  Private
const uploadResume = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const { cloudinaryResult, originalFileName } = req;

        if (!cloudinaryResult) {
            return res.status(400).json({
                success: false,
                msg: 'No file uploaded'
            });
        }

        const jobseekerProfile = await Jobseeker.findOne({ userId });
        if (!jobseekerProfile) {
            return res.status(404).json({
                success: false,
                msg: 'Jobseeker profile not found'
            });
        }

        // Update resume details
        jobseekerProfile.resume = {
            url: cloudinaryResult.secure_url,
            public_id: cloudinaryResult.public_id,
            original_name: originalFileName,
            uploaded_at: new Date(),
            file_size: cloudinaryResult.bytes
        };

        await jobseekerProfile.save();

        res.status(200).json({
            success: true,
            msg: 'Resume uploaded successfully',
            data: jobseekerProfile.resume
        });
    } catch (err) {
        console.error('Resume upload controller error:', err);
        res.status(500).json({
            success: false,
            msg: 'Failed to save resume details'
        });
    }
};

// @desc    Delete resume
// @route   DELETE /api/jobseeker/resume
// @access  Private
const deleteResume = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        const jobseekerProfile = await Jobseeker.findOne({ userId });
        if (!jobseekerProfile) {
            return res.status(404).json({
                success: false,
                msg: 'Jobseeker profile not found'
            });
        }

        // Delete from Cloudinary if exists
        if (jobseekerProfile.resume && jobseekerProfile.resume.public_id) {
            await cloudinary.uploader.destroy(jobseekerProfile.resume.public_id);
        }

        // Clear resume details
        jobseekerProfile.resume = undefined;
        await jobseekerProfile.save();

        res.status(200).json({
            success: true,
            msg: 'Resume deleted successfully'
        });
    } catch (err) {
        console.error('Resume delete controller error:', err);
        res.status(500).json({
            success: false,
            msg: 'Failed to delete resume'
        });
    }
};

// @desc    Get resume details
// @route   GET /api/jobseeker/resume
// @access  Private
const getResumeDetails = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        const jobseekerProfile = await Jobseeker.findOne({ userId });
        if (!jobseekerProfile) {
            return res.status(404).json({
                success: false,
                msg: 'Jobseeker profile not found'
            });
        }

        if (!jobseekerProfile.resume) {
            return res.status(404).json({
                success: false,
                msg: 'No resume found'
            });
        }

        res.status(200).json({
            success: true,
            data: jobseekerProfile.resume
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get job recommendations
// @route   GET /api/jobseeker/recommendations
// @access  Private
const getJobRecommendations = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const { limit = 10 } = req.query;

        const jobseekerProfile = await Jobseeker.findOne({ userId });
        if (!jobseekerProfile) {
            return res.status(404).json({
                success: false,
                message: 'Jobseeker profile not found'
            });
        }

        // Build recommendation query based on user's skills and preferences
        // Only show approved (active) jobs
        const query = {
            status: 'approved',
            $or: []
        };

        // Match skills
        if (jobseekerProfile.skills && jobseekerProfile.skills.length > 0) {
            query.$or.push({
                requiredSkills: { $in: jobseekerProfile.skills }
            });
        }

        // Match job title with user's current job title
        if (jobseekerProfile.jobTitle) {
            query.$or.push({
                title: { $regex: jobseekerProfile.jobTitle, $options: 'i' }
            });
        }

        // Match location
        if (jobseekerProfile.location) {
            query.$or.push({
                location: { $regex: jobseekerProfile.location, $options: 'i' }
            });
        }

        // If no criteria, just get recent jobs
        if (query.$or.length === 0) {
            delete query.$or;
        }

        const recommendations = await Job.find(query)
            .populate('employer', 'name companyLogo')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        console.error('Get job recommendations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch job recommendations'
        });
    }
};

// @desc    Get dashboard data (Optimized - Single API call)
// @route   GET /api/jobseeker/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        // OPTIMIZED: Get jobseeker profile with populated data in one query
        const jobseekerProfile = await Jobseeker.findOne({ userId })
            .populate({
                path: 'savedJobs',
                match: { status: 'approved' }, // Only show active saved jobs
                select: 'title company location ctc jobType createdAt',
                options: { limit: 5, sort: { createdAt: -1 } }
            });

        // OPTIMIZED: Parallel execution with reduced queries
        const [
            applications,
            jobRecommendations,
            interviews,
            notifications
        ] = await Promise.all([
            // Get all applications with job details for active jobs only
            Application.find({ applicant: userId })
                .populate({
                    path: 'job',
                    match: { status: 'approved' },
                    select: 'title company location ctc jobType status'
                })
                .sort({ createdAt: -1 })
                .limit(10),

            // Get job recommendations based on profile skills (only active jobs)
            Job.find({
                status: 'approved',
                skills: { $in: jobseekerProfile?.skills || [] }
            })
                .populate('employer', 'name')
                .sort({ createdAt: -1 })
                .limit(8),

            // Get upcoming interviews
            Interview.find({
                jobseeker: userId,
                scheduledAt: { $gte: new Date() }
            })
                .populate('job', 'title company')
                .sort({ scheduledAt: 1 })
                .limit(5),

            // Get recent notifications
            Notification.find({
                recipient: userId,
                read: false
            })
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        // Filter out applications where the job is null (inactive jobs)
        const activeApplications = applications.filter(app => app.job !== null);

        // Calculate stats from fetched data (no additional DB queries)
        const stats = {
            totalApplications: activeApplications.length,
            pendingApplications: activeApplications.filter(app => app.status === 'pending').length,
            interviewApplications: activeApplications.filter(app =>
                ['interview_scheduled', 'interview_completed'].includes(app.status)
            ).length,
            rejectedApplications: activeApplications.filter(app => app.status === 'rejected').length,
            acceptedApplications: activeApplications.filter(app => app.status === 'accepted').length,
            savedJobs: jobseekerProfile?.savedJobs?.length || 0,
            upcomingInterviews: interviews.length,
            unreadNotifications: notifications.length,
            profileCompleteness: calculateProfileCompleteness(jobseekerProfile),
            recentApplications: activeApplications.filter(app => {
                const dayAgo = new Date();
                dayAgo.setDate(dayAgo.getDate() - 7); // Last 7 days
                return new Date(app.createdAt) > dayAgo;
            }).length
        };

        // Prepare comprehensive dashboard data
        const dashboardData = {
            profile: jobseekerProfile,
            stats,
            recentApplications: activeApplications.slice(0, 5),
            savedJobs: jobseekerProfile?.savedJobs || [],
            jobRecommendations: jobRecommendations.slice(0, 5),
            upcomingInterviews: interviews,
            notifications: notifications
        };

        res.status(200).json({
            success: true,
            data: dashboardData,
            message: 'Dashboard data retrieved successfully'
        });
    } catch (error) {
        console.error('Get dashboard data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data'
        });
    }
};

// Helper function to calculate profile completeness
const calculateProfileCompleteness = (profile) => {
    if (!profile) return 0;

    const fields = [
        'name', 'email', 'phone', 'location', 'jobTitle',
        'summary', 'skills', 'experience', 'education'
    ];

    let completedFields = 0;
    fields.forEach(field => {
        if (profile[field] &&
            (Array.isArray(profile[field]) ? profile[field].length > 0 : profile[field].toString().trim())) {
            completedFields++;
        }
    });

    return Math.round((completedFields / fields.length) * 100);
};

// @desc    Get interview schedule
// @route   GET /api/jobseeker/interviews
// @access  Private
const getInterviewSchedule = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        // Get applications with interview status for active jobs only
        const interviews = await Application.find({
            applicant: userId,
            status: { $in: ['interview_scheduled', 'interview_completed'] }
        })
        .populate({
            path: 'job',
            match: { status: 'approved' },
            select: 'title company location'
        })
        .populate('employer', 'name email')
        .sort({ updatedAt: -1 });

        // Filter out interviews where the job is null (inactive jobs)
        const activeInterviews = interviews.filter(interview => interview.job !== null);

        res.status(200).json({
            success: true,
            data: activeInterviews
        });
    } catch (error) {
        console.error('Get interview schedule error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch interview schedule'
        });
    }
};

// @desc    Get jobseeker statistics
// @route   GET /api/jobseeker/stats
// @access  Private
const getJobseekerStats = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        const [
            totalApplications,
            pendingApplications,
            interviewApplications,
            rejectedApplications,
            savedJobsCount
        ] = await Promise.all([
            Application.countDocuments({ applicant: userId }),
            Application.countDocuments({ applicant: userId, status: 'pending' }),
            Application.countDocuments({
                applicant: userId,
                status: { $in: ['interview_scheduled', 'interview_completed'] }
            }),
            Application.countDocuments({ applicant: userId, status: 'rejected' }),
            Jobseeker.findOne({ userId }).then(profile => profile?.savedJobs?.length || 0)
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalApplications,
                pendingApplications,
                interviewApplications,
                rejectedApplications,
                savedJobs: savedJobsCount
            }
        });
    } catch (error) {
        console.error('Get jobseeker stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch jobseeker statistics'
        });
    }
};

// @desc    Get jobseeker notifications
// @route   GET /api/jobseeker/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const { page = 1, limit = 20, unreadOnly = false } = req.query;

        // Build query
        const query = { recipient: userId };
        if (unreadOnly === 'true') {
            query.read = false;
        }

        // Get notifications with pagination
        const notifications = await Notification.find(query)
            .populate('sender', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Get total count for pagination
        const total = await Notification.countDocuments(query);

        res.status(200).json({
            success: true,
            data: notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/jobseeker/notifications/:id/read
// @access  Private
const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId || req.user.id;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: userId },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read'
        });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/jobseeker/notifications/mark-all-read
// @access  Private
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        await Notification.updateMany(
            { recipient: userId, read: false },
            { read: true }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read'
        });
    }
};

// @desc    Update interview response
// @route   PUT /api/jobseeker/interviews/:id
// @access  Private
const updateInterviewResponse = async (req, res) => {
    try {
        const { id } = req.params;
        const { response } = req.body;
        const userId = req.user.userId || req.user.id;

        // Find the application/interview
        const application = await Application.findOne({
            _id: id,
            applicant: userId
        }).populate({
            path: 'job',
            match: { status: 'approved' }, // Only allow responses for active jobs
            select: 'title company'
        });

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Check if the job is active
        if (!application.job) {
            return res.status(404).json({
                success: false,
                message: 'Job is no longer active'
            });
        }

        // Update the application with the interview response
        application.interviewResponse = response;
        await application.save();

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        console.error('Update interview response error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update interview response'
        });
    }
};

// Export all controller functions
module.exports = {
    getJobseekerProfile,
    updateJobseekerProfile,
    getSavedJobs,
    saveJob,
    unsaveJob,
    getAppliedJobs,
    uploadResume,
    deleteResume,
    getResumeDetails,
    getJobRecommendations,
    getDashboardData,
    getInterviewSchedule,
    getJobseekerStats,
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    updateInterviewResponse
};