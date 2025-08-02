const express = require('express');
const router = express.Router();
const multer = require('multer');
const jobseekerController = require('../controllers/jobseeker-controller');
const { verifyToken } = require('../middleware/auth-middleware');
const { uploadLimiter } = require('../middleware/security-middleware');
const { resumeStorage } = require('../config/cloudinary');

// Profile routes
router.get('/profile', verifyToken, jobseekerController.getJobseekerProfile);
router.put('/profile', verifyToken, jobseekerController.updateJobseekerProfile);

// Saved jobs routes
router.get('/saved-jobs', verifyToken, jobseekerController.getSavedJobs);
router.post('/saved-jobs/:jobId', verifyToken, jobseekerController.saveJob);
router.delete('/saved-jobs/:jobId', verifyToken, jobseekerController.unsaveJob);

// Applied jobs routes
router.get('/applied-jobs', verifyToken, jobseekerController.getAppliedJobs);

// Dashboard and stats routes
router.get('/dashboard', verifyToken, jobseekerController.getDashboardData);
router.get('/stats', verifyToken, jobseekerController.getJobseekerStats);

// Recommendations and interviews
router.get('/recommendations', verifyToken, jobseekerController.getJobRecommendations);
router.get('/interviews', verifyToken, jobseekerController.getInterviewSchedule);

// Notifications routes
router.get('/notifications', verifyToken, jobseekerController.getNotifications);
router.put('/notifications/:id/read', verifyToken, jobseekerController.markNotificationAsRead);
router.put('/notifications/mark-all-read', verifyToken, jobseekerController.markAllNotificationsAsRead);

// Resume details route
router.get('/resume', verifyToken, jobseekerController.getResumeDetails);

// Resume upload configuration using Cloudinary storage - PDF ONLY
const resumeUpload = multer({
    storage: resumeStorage, // Use the configured Cloudinary storage
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for PDF files
    },
    fileFilter: (_req, file, cb) => {
        console.log('File filter called with:', file);
        console.log('File mimetype:', file.mimetype);
        console.log('File originalname:', file.originalname);

        // Only accept PDF files
        if (file.mimetype === 'application/pdf') {
            console.log('PDF file accepted:', file.originalname);
            cb(null, true);
        } else {
            console.log('File type rejected. Only PDF files are allowed:', file.mimetype);
            cb(new Error('Only PDF files are allowed. Please convert your document to PDF format.'), false);
        }
    }
});

// PDF upload to Cloudinary using configured storage with rate limiting
router.post('/upload-resume', verifyToken, uploadLimiter, resumeUpload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                msg: 'No file uploaded'
            });
        }

        console.log('PDF file uploaded to Cloudinary:', req.file);
        console.log('Cloudinary result:', {
            url: req.file.path,
            public_id: req.file.filename,
            original_name: req.file.originalname
        });

        // Prepare data for controller
        req.cloudinaryResult = {
            secure_url: req.file.path,
            public_id: req.file.filename,
            resource_type: 'image',
            format: 'pdf',
            bytes: req.file.size
        };
        req.originalFileName = req.file.originalname;

        // Call the upload controller
        await jobseekerController.uploadResume(req, res);

    } catch (error) {
        console.error('Resume upload error:', error);
        return res.status(500).json({
            success: false,
            msg: 'Failed to upload PDF to cloud storage',
            error: error.message
        });
    }
});

// Resume delete route
router.delete('/resume', verifyToken, jobseekerController.deleteResume);

// Resume proxy route to serve PDFs with proper headers
router.get('/resume/view/:userId?', verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId || req.user.userId || req.user.id;
        console.log('Serving resume for user:', userId);

        const Jobseeker = require('../models/Jobseeker');
        const jobseekerProfile = await Jobseeker.findOne({ userId });

        if (!jobseekerProfile || !jobseekerProfile.resume || !jobseekerProfile.resume.url) {
            return res.status(404).json({
                success: false,
                msg: 'Resume not found'
            });
        }

        const resumeUrl = jobseekerProfile.resume.url;
        console.log('Proxying resume URL:', resumeUrl);

        // Fetch the PDF from Cloudinary with authentication
        const axios = require('axios');
        const response = await axios.get(resumeUrl, {
            responseType: 'stream',
            headers: {
                'User-Agent': 'TalentFlow-Backend/1.0'
            }
        });

        // Set proper headers for PDF viewing or downloading
        const isDownload = req.query.download === 'true';
        const filename = jobseekerProfile.resume.original_name || 'resume.pdf';

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', isDownload ?
            `attachment; filename="${filename}"` :
            `inline; filename="${filename}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');

        // Pipe the PDF stream to the response
        response.data.pipe(res);

    } catch (error) {
        console.error('Resume proxy error:', error);
        res.status(500).json({
            success: false,
            msg: 'Failed to serve resume',
            error: error.message
        });
    }
});

module.exports = router;
