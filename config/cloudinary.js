const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'talentflow',
    allowedFormats: ['jpeg', 'png', 'jpg']
  }
});

// Resume storage configuration - PDF ONLY with public access
const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'talentflow/resumes',
    allowedFormats: ['pdf'], // Only PDF format allowed
    resource_type: 'image', // Force image resource type for public access
    format: 'pdf', // Explicitly set PDF format
    access_mode: 'public', // Ensure public access
    // Generate a unique filename WITHOUT extension (format=pdf will add it)
    public_id: (_req, file) => {
      const timestamp = Date.now();
      const originalName = file.originalname
        .split('.')[0]
        .replace(/[^a-zA-Z0-9]/g, '_');
      return `resume_${originalName}_${timestamp}`; // NO .pdf extension - format will add it
    }
  }
});

module.exports = {
  cloudinary,
  storage,
  resumeStorage
};
