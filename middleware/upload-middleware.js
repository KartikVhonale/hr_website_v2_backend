const multer = require('multer');
const { resumeStorage } = require('../config/cloudinary');

// Resume upload configuration using Cloudinary storage - PDF ONLY
const resumeUpload = multer({
    storage: resumeStorage, // Use the configured Cloudinary storage
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for PDF files
    },
    fileFilter: (_req, file, cb) => {
        // Only accept PDF files
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed. Please convert your document to PDF format.'), false);
        }
    }
});

module.exports = {
    resumeUpload
};
