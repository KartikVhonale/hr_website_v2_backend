const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const express = require('express');
const path = require('path');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test PDF storage configuration
const testPdfStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'talentflow/test-resumes',
    allowedFormats: ['pdf'],
    resource_type: 'auto', // Let Cloudinary auto-detect
    format: 'pdf', // Maintain PDF format
    public_id: (req, file) => {
      const timestamp = Date.now();
      const originalName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
      return `test_resume_${originalName}_${timestamp}`;
    }
  }
});

const app = express();

// Test upload endpoint
const upload = multer({ 
  storage: testPdfStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    console.log('=== PDF UPLOAD TEST ===');
    console.log('File details:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype
    });
    
    if (file.mimetype === 'application/pdf') {
      console.log('✅ PDF file accepted');
      cb(null, true);
    } else {
      console.log('❌ Only PDF files allowed');
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

app.post('/test-pdf-upload', upload.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('=== CLOUDINARY UPLOAD RESULT ===');
    console.log('File uploaded successfully:', {
      url: req.file.path,
      public_id: req.file.filename,
      original_name: req.file.originalname,
      size: req.file.size,
      format: req.file.format,
      resource_type: req.file.resource_type
    });

    res.json({
      success: true,
      message: 'PDF uploaded successfully to Cloudinary',
      data: {
        url: req.file.path,
        public_id: req.file.filename,
        original_name: req.file.originalname,
        cloudinary_info: {
          format: req.file.format,
          resource_type: req.file.resource_type,
          bytes: req.file.bytes,
          width: req.file.width,
          height: req.file.height,
          pages: req.file.pages
        }
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

// Test delete endpoint
app.delete('/test-pdf-delete/:public_id', async (req, res) => {
  try {
    const publicId = req.params.public_id;
    console.log('=== PDF DELETE TEST ===');
    console.log('Deleting file with public_id:', publicId);

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'auto'
    });

    console.log('Delete result:', result);

    res.json({
      success: true,
      message: 'PDF deleted successfully',
      result: result
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Delete failed',
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'PDF upload test server is running',
    cloudinary_config: {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'
    }
  });
});

const PORT = 3002;

app.listen(PORT, () => {
  console.log(`PDF Upload Test Server running on port ${PORT}`);
  console.log('Test endpoints:');
  console.log(`- GET  http://localhost:${PORT}/health`);
  console.log(`- POST http://localhost:${PORT}/test-pdf-upload (with PDF file)`);
  console.log(`- DELETE http://localhost:${PORT}/test-pdf-delete/:public_id`);
  console.log('\nTo test PDF upload:');
  console.log('curl -X POST -F "pdf=@your-resume.pdf" http://localhost:3002/test-pdf-upload');
});
