const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test PDF extension preservation
const testPdfExtension = async () => {
  console.log('=== PDF EXTENSION PRESERVATION TEST ===');
  
  // Simulate file upload with proper extension
  const timestamp = Date.now();
  const originalName = 'John_Doe_Resume.pdf'
    .split('.')[0]
    .replace(/[^a-zA-Z0-9]/g, '_');
  const uniqueFilename = `resume_${originalName}_${timestamp}.pdf`; // ✅ Include .pdf extension
  
  console.log('Original filename:', 'John_Doe_Resume.pdf');
  console.log('Generated public_id:', `talentflow/resumes/${uniqueFilename}`);
  console.log('Expected URL format:', `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/v${timestamp}/talentflow/resumes/${uniqueFilename}`);
  
  // Test URL generation
  const testUrl = cloudinary.url(`talentflow/resumes/${uniqueFilename}`, {
    resource_type: 'raw',
    secure: true
  });
  
  console.log('Generated URL:', testUrl);
  console.log('URL ends with .pdf:', testUrl.endsWith('.pdf'));
  console.log('URL contains proper extension:', testUrl.includes('.pdf'));
  
  // Test download URL with attachment flag
  const downloadUrl = cloudinary.url(`talentflow/resumes/${uniqueFilename}`, {
    resource_type: 'raw',
    flags: 'attachment',
    secure: true
  });
  
  console.log('Download URL:', downloadUrl);
  console.log('Download URL has attachment flag:', downloadUrl.includes('fl_attachment'));
  
  // Test with custom download filename
  const customDownloadUrl = cloudinary.url(`talentflow/resumes/${uniqueFilename}`, {
    resource_type: 'raw',
    flags: 'attachment',
    transformation: [
      { raw_transformation: 'dl_John_Doe_Resume.pdf' }
    ],
    secure: true
  });
  
  console.log('Custom download URL:', customDownloadUrl);
  
  console.log('=== TEST COMPLETE ===');
  
  return {
    publicId: `talentflow/resumes/${uniqueFilename}`,
    viewUrl: testUrl,
    downloadUrl: downloadUrl,
    customDownloadUrl: customDownloadUrl,
    hasExtension: testUrl.endsWith('.pdf'),
    hasAttachmentFlag: downloadUrl.includes('fl_attachment')
  };
};

// Run the test
testPdfExtension()
  .then(result => {
    console.log('\n=== TEST RESULTS ===');
    console.log('Public ID:', result.publicId);
    console.log('View URL:', result.viewUrl);
    console.log('Download URL:', result.downloadUrl);
    console.log('Has .pdf extension:', result.hasExtension);
    console.log('Has attachment flag:', result.hasAttachmentFlag);
    
    if (result.hasExtension && result.hasAttachmentFlag) {
      console.log('✅ PDF extension preservation test PASSED');
    } else {
      console.log('❌ PDF extension preservation test FAILED');
    }
  })
  .catch(error => {
    console.error('Test failed:', error);
  });
