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
            message: 'Profile updated successfully',
            data: profileData
        });
    } catch (err) {
        console.error(err.message);

        // Handle validation errors
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                msg: 'Validation Error',
                errors: errors
            });
        }

        res.status(500).json({
            success: false,
            msg: 'Server Error'
        });
    }
};

// @desc    Get saved jobs
// @route   GET /api/jobseeker/saved-jobs
// @access  Private
const getSavedJobs = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        // Get jobseeker profile with populated job details
        let jobseekerProfile = await Jobseeker.findOne({ userId }).populate({
            path: 'savedJobs',
            populate: {
                path: 'employer',
                model: 'User',
                select: 'name email'
            }
        });

        // If profile doesn't exist, create one or return empty array
        if (!jobseekerProfile) {
            return res.status(200).json({
                success: true,
                data: [],
                message: 'No jobseeker profile found, but returning empty saved jobs array'
            });
        }

        res.status(200).json({
            success: true,
            data: jobseekerProfile.savedJobs || []
        });
    } catch (err) {
        console.error('Error in getSavedJobs:', err);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};

// @desc    Save a job
// @route   POST /api/jobseeker/saved-jobs/:jobId
// @access  Private
const saveJob = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        // Get or create jobseeker profile
        let jobseekerProfile = await Jobseeker.findOne({ userId });
        if (!jobseekerProfile) {
            jobseekerProfile = new Jobseeker({
                userId,
                savedJobs: []
            });
        }

        const job = await Job.findById(req.params.jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if the job is already saved
        if (jobseekerProfile.savedJobs.includes(req.params.jobId)) {
            return res.status(200).json({
                success: true,
                data: jobseekerProfile.savedJobs,
                message: 'Job already saved'
            });
        }

        jobseekerProfile.savedJobs.push(req.params.jobId);
        await jobseekerProfile.save();

        res.status(200).json({
            success: true,
            data: jobseekerProfile.savedJobs,
            message: 'Job saved successfully'
        });
    } catch (err) {
        console.error('Error in saveJob:', err);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};

// @desc    Unsave a job
// @route   DELETE /api/jobseeker/saved-jobs/:jobId
// @access  Private
const unsaveJob = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        // Get jobseeker profile
        const jobseekerProfile = await Jobseeker.findOne({ userId });
        if (!jobseekerProfile) {
            return res.status(200).json({
                success: true,
                data: [],
                message: 'No profile found, job was not saved anyway'
            });
        }

        const job = await Job.findById(req.params.jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if the job is saved
        if (!jobseekerProfile.savedJobs.includes(req.params.jobId)) {
            return res.status(200).json({
                success: true,
                data: jobseekerProfile.savedJobs,
                message: 'Job was not saved'
            });
        }

        jobseekerProfile.savedJobs = jobseekerProfile.savedJobs.filter(
            (jobId) => jobId.toString() !== req.params.jobId
        );
        await jobseekerProfile.save();

        res.status(200).json({
            success: true,
            data: jobseekerProfile.savedJobs
        });
    } catch (err) {
        console.error('Error in unsaveJob:', err);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};

// @desc    Get applied jobs
// @route   GET /api/jobseeker/applied-jobs
// @access  Private
const getAppliedJobs = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        const applications = await Application.find({ applicant: userId }).populate('job');
        res.json(applications);
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

        // Check if Cloudinary result exists (from router)
        if (!req.cloudinaryResult) {
            return res.status(400).json({
                success: false,
                msg: 'No file uploaded or Cloudinary upload failed'
            });
        }

        // Get or create jobseeker profile
        let jobseekerProfile = await Jobseeker.findOne({ userId });
        if (!jobseekerProfile) {
            jobseekerProfile = new Jobseeker({
                userId,
                skills: [],
                experience: [],
                education: [],
                certifications: [],
                socialLinks: {}
            });
        }

        // Delete old resume from Cloudinary if exists
        if (jobseekerProfile.resume && jobseekerProfile.resume.public_id) {
            try {
                // Try to determine resource type from stored data, fallback to auto-detection
                const resourceType = jobseekerProfile.resume.cloudinary_info?.resource_type || 'image';
                await cloudinary.uploader.destroy(jobseekerProfile.resume.public_id, {
                    resource_type: resourceType
                });
            } catch (error) {
                // Try with different resource type if first attempt fails
                try {
                    await cloudinary.uploader.destroy(jobseekerProfile.resume.public_id, {
                        resource_type: 'raw'
                    });
                } catch (secondError) {
                    console.error('Failed to delete old resume from Cloudinary:', secondError.message);
                }
            }
        }

        // Store new resume information from Cloudinary result
        jobseekerProfile.resume = {
            url: req.cloudinaryResult.secure_url, // Direct PDF URL from Cloudinary
            public_id: req.cloudinaryResult.public_id,
            original_name: req.originalFileName,
            uploaded_at: new Date(),
            cloudinary_info: {
                asset_id: req.cloudinaryResult.asset_id,
                format: req.cloudinaryResult.format,
                resource_type: req.cloudinaryResult.resource_type,
                bytes: req.cloudinaryResult.bytes,
                pages: req.cloudinaryResult.pages
            }
        };

        await jobseekerProfile.save();

        // Get updated user info for complete response
        const user = await User.findById(userId).select('-password');

        // Ensure resume URL is in correct format (convert raw to image if needed)
        if (jobseekerProfile.resume && jobseekerProfile.resume.url) {
            if (jobseekerProfile.resume.url.includes('/raw/upload/')) {
                const oldUrl = jobseekerProfile.resume.url;
                const newUrl = oldUrl.replace('/raw/upload/', '/image/upload/');
                jobseekerProfile.resume.url = newUrl;
                await jobseekerProfile.save();
            }
        }

        // Return complete profile data like in getJobseekerProfile
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
            message: 'Resume uploaded successfully in PDF format',
            data: {
                resume: jobseekerProfile.resume,
                profile: profileData
            }
        });

    } catch (err) {
        console.error('Resume upload error:', err);
        res.status(500).json({
            success: false,
            msg: 'Server Error',
            error: err.message
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
        if (!jobseekerProfile || !jobseekerProfile.resume) {
            return res.status(404).json({
                success: false,
                msg: 'No resume found'
            });
        }

        // Delete from Cloudinary
        if (jobseekerProfile.resume.public_id) {
            try {
                // Try to determine resource type from stored data, fallback to auto-detection
                const resourceType = jobseekerProfile.resume.cloudinary_info?.resource_type || 'image';
                await cloudinary.uploader.destroy(jobseekerProfile.resume.public_id, {
                    resource_type: resourceType
                });
            } catch (error) {
                // Try with different resource type if first attempt fails
                try {
                    await cloudinary.uploader.destroy(jobseekerProfile.resume.public_id, {
                        resource_type: 'raw'
                    });
                } catch (secondError) {
                    console.error('Failed to delete resume from Cloudinary:', secondError.message);
                }
            }
        }

        // Remove from database
        jobseekerProfile.resume = null;
        await jobseekerProfile.save();

        // Get updated user info for complete response
        const user = await User.findById(userId).select('-password');

        // Return complete profile data
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
            resume: jobseekerProfile.resume, // Will be null
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
            message: 'Resume deleted successfully',
            data: {
                profile: profileData
            }
        });

    } catch (err) {
        console.error('Resume delete error:', err);
        res.status(500).json({
            success: false,
            msg: 'Server Error',
            error: err.message
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
        if (!jobseekerProfile || !jobseekerProfile.resume) {
            return res.status(404).json({
                success: false,
                message: 'Resume not found'
            });
        }

        res.status(200).json({
            success: true,
            data: jobseekerProfile.resume
        });
    } catch (error) {
        console.error('Get resume details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch resume details'
        });
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
        const query = {
            status: 'active',
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
            // Get all applications with job details
            Application.find({ applicant: userId })
                .populate('job', 'title company location ctc jobType status')
                .sort({ createdAt: -1 })
                .limit(10),

            // Get job recommendations based on profile skills
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

        // Calculate stats from fetched data (no additional DB queries)
        const stats = {
            totalApplications: applications.length,
            pendingApplications: applications.filter(app => app.status === 'pending').length,
            interviewApplications: applications.filter(app =>
                ['interview_scheduled', 'interview_completed'].includes(app.status)
            ).length,
            rejectedApplications: applications.filter(app => app.status === 'rejected').length,
            acceptedApplications: applications.filter(app => app.status === 'accepted').length,
            savedJobs: jobseekerProfile?.savedJobs?.length || 0,
            upcomingInterviews: interviews.length,
            unreadNotifications: notifications.length,
            profileCompleteness: calculateProfileCompleteness(jobseekerProfile),
            recentApplications: applications.filter(app => {
                const dayAgo = new Date();
                dayAgo.setDate(dayAgo.getDate() - 7); // Last 7 days
                return new Date(app.createdAt) > dayAgo;
            }).length
        };

        // Prepare comprehensive dashboard data
        const dashboardData = {
            profile: jobseekerProfile,
            stats,
            recentApplications: applications.slice(0, 5),
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

        // Get applications with interview status
        const interviews = await Application.find({
            applicant: userId,
            status: { $in: ['interview_scheduled', 'interview_completed'] }
        })
        .populate('job', 'title company location')
        .populate('employer', 'name email')
        .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            data: interviews
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
        const userId = req.user.userId || req.user.id;
        const notificationId = req.params.id;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId },
            { read: true, readAt: new Date() },
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

        const result = await Notification.updateMany(
            { recipient: userId, read: false },
            { read: true, readAt: new Date() }
        );

        res.status(200).json({
            success: true,
            message: `Marked ${result.modifiedCount} notifications as read`
        });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read'
        });
    }
};

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
    markAllNotificationsAsRead
};
