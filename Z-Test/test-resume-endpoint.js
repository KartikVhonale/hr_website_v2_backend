const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// Simple test server to check if resume upload endpoint works
const app = express();

app.use(cors());
app.use(express.json());

// Simple multer setup for testing
const upload = multer({ dest: 'uploads/' });

// Test route
app.post('/api/jobseeker/upload-resume', upload.single('resume'), (req, res) => {
  console.log('Test endpoint hit!');
  console.log('File:', req.file);
  console.log('Body:', req.body);
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      msg: 'No file uploaded'
    });
  }
  
  res.json({
    success: true,
    message: 'Test upload successful',
    file: req.file
  });
});

// Test basic endpoint
app.get('/api/jobseeker/test', (req, res) => {
  res.json({
    success: true,
    message: 'Jobseeker API is working'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

const PORT = 3001; // Different port to avoid conflicts

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test endpoints:`);
  console.log(`- GET  http://localhost:${PORT}/health`);
  console.log(`- GET  http://localhost:${PORT}/api/jobseeker/test`);
  console.log(`- POST http://localhost:${PORT}/api/jobseeker/upload-resume`);
});
