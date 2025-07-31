const User = require('../models/User');
const Jobseeker = require('../models/Jobseeker');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get jobseeker profile
// @route   GET /api/jobseeker/profile
// @access  Private
const getJobseekerProfile = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        console.log('getJobseekerProfile - User ID:', userId);

        // Get basic user info
        const user = await User.findById(userId).select('-password');
        if (!user) {
            console.log('getJobseekerProfile - User not found with ID:', userId);
            return res.status(404).json({
                success: false,
                msg: 'User not found'
            });
        }

        // Get jobseeker profile or create if doesn't exist
        let jobseekerProfile = await Jobseeker.findOne({ userId });
        if (!jobseekerProfile) {
            console.log('Creating new jobseeker profile for user:', userId);
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
                console.log('Auto-migrated resume URL from raw to image format');
                console.log('Old URL:', oldUrl);
                console.log('New URL:', newUrl);
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
    console.log('updateJobseekerProfile called');
    console.log('User from token:', req.user);
    console.log('Request body:', req.body);

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
        console.log('Looking for user with ID:', userId);

        // Update user basic info if provided
        let user = await User.findById(userId);
        if (!user) {
            console.log('User not found with ID:', userId);
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
            console.log('User basic info updated');
        }

        // Update or create jobseeker profile
        let jobseekerProfile = await Jobseeker.findOne({ userId });
        if (!jobseekerProfile) {
            console.log('Creating new jobseeker profile');
            jobseekerProfile = new Jobseeker({
                userId,
                ...jobseekerFields
            });
        } else {
            console.log('Updating existing jobseeker profile');
            Object.assign(jobseekerProfile, jobseekerFields);
        }

        await jobseekerProfile.save();
        console.log('Jobseeker profile updated successfully');

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

        // Get jobseeker profile
        const jobseekerProfile = await Jobseeker.findOne({ userId }).populate('savedJobs');
        if (!jobseekerProfile) {
            return res.status(404).json({ msg: 'Jobseeker profile not found' });
        }

        res.json(jobseekerProfile.savedJobs);
    } catch (err) {
        console.error('Error in getSavedJobs:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
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
            return res.status(404).json({ msg: 'Job not found' });
        }

        // Check if the job is already saved
        if (jobseekerProfile.savedJobs.includes(req.params.jobId)) {
            return res.status(400).json({ msg: 'Job already saved' });
        }

        jobseekerProfile.savedJobs.push(req.params.jobId);
        await jobseekerProfile.save();

        res.json(jobseekerProfile.savedJobs);
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

        // Get jobseeker profile
        const jobseekerProfile = await Jobseeker.findOne({ userId });
        if (!jobseekerProfile) {
            return res.status(404).json({ msg: 'Jobseeker profile not found' });
        }

        const job = await Job.findById(req.params.jobId);
        if (!job) {
            return res.status(404).json({ msg: 'Job not found' });
        }

        // Check if the job is saved
        if (!jobseekerProfile.savedJobs.includes(req.params.jobId)) {
            return res.status(400).json({ msg: 'Job not saved' });
        }

        jobseekerProfile.savedJobs = jobseekerProfile.savedJobs.filter(
            (jobId) => jobId.toString() !== req.params.jobId
        );
        await jobseekerProfile.save();

        res.json(jobseekerProfile.savedJobs);
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
        console.log('uploadResume called for user:', userId);

        // Check if Cloudinary result exists (from router)
        if (!req.cloudinaryResult) {
            return res.status(400).json({
                success: false,
                msg: 'No file uploaded or Cloudinary upload failed'
            });
        }

        console.log('Cloudinary result received:', req.cloudinaryResult);

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
                console.log('Old resume deleted from Cloudinary with resource type:', resourceType);
            } catch (error) {
                console.log('Error deleting old resume:', error.message);
                // Try with different resource type if first attempt fails
                try {
                    await cloudinary.uploader.destroy(jobseekerProfile.resume.public_id, {
                        resource_type: 'raw'
                    });
                    console.log('Old resume deleted from Cloudinary with raw resource type');
                } catch (secondError) {
                    console.log('Failed to delete with both resource types:', secondError.message);
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

        console.log('PDF stored with URL:', req.cloudinaryResult.secure_url);
        console.log('PDF format:', req.cloudinaryResult.format);
        console.log('Resource type:', req.cloudinaryResult.resource_type);

        await jobseekerProfile.save();
        console.log('Resume uploaded successfully');

        // Get updated user info for complete response
        const user = await User.findById(userId).select('-password');

        // Ensure resume URL is in correct format (convert raw to image if needed)
        if (jobseekerProfile.resume && jobseekerProfile.resume.url) {
            if (jobseekerProfile.resume.url.includes('/raw/upload/')) {
                const oldUrl = jobseekerProfile.resume.url;
                const newUrl = oldUrl.replace('/raw/upload/', '/image/upload/');
                jobseekerProfile.resume.url = newUrl;
                await jobseekerProfile.save();
                console.log('Auto-migrated resume URL from raw to image format');
                console.log('Old URL:', oldUrl);
                console.log('New URL:', newUrl);
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
        console.log('deleteResume called for user:', userId);

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
                console.log('Resume deleted from Cloudinary with resource type:', resourceType);
            } catch (error) {
                console.log('Error deleting resume from Cloudinary:', error.message);
                // Try with different resource type if first attempt fails
                try {
                    await cloudinary.uploader.destroy(jobseekerProfile.resume.public_id, {
                        resource_type: 'raw'
                    });
                    console.log('Resume deleted from Cloudinary with raw resource type');
                } catch (secondError) {
                    console.log('Failed to delete with both resource types:', secondError.message);
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

module.exports = {
    getJobseekerProfile,
    updateJobseekerProfile,
    getSavedJobs,
    saveJob,
    unsaveJob,
    getAppliedJobs,
    uploadResume,
    deleteResume,
};
