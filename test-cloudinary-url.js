require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('=== CLOUDINARY URL GENERATION TEST ===\n');

// Test URL generation for the new configuration
const testPublicId = 'talentflow/resumes/resume_resume2_1753968778591';

console.log('Test Configuration:');
console.log('- Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('- Public ID:', testPublicId);

// Generate URL with image resource type and PDF format
const imageUrl = cloudinary.url(testPublicId, {
  resource_type: 'image',
  format: 'pdf',
  secure: true
});

console.log('\nGenerated URLs:');
console.log('- Image URL:', imageUrl);

// Generate download URL
const downloadUrl = cloudinary.url(testPublicId, {
  resource_type: 'image',
  format: 'pdf',
  flags: 'attachment',
  secure: true
});

console.log('- Download URL:', downloadUrl);

// Test if URLs are properly formatted
console.log('\nURL Validation:');
console.log('- Contains /image/upload/:', imageUrl.includes('/image/upload/'));
console.log('- Contains talentflow/resumes:', imageUrl.includes('talentflow/resumes'));
console.log('- Ends with .pdf:', imageUrl.endsWith('.pdf'));
console.log('- No double extension:', !imageUrl.includes('.pdf.pdf'));
console.log('- Uses HTTPS:', imageUrl.startsWith('https://'));

console.log('\nDownload URL Validation:');
console.log('- Has attachment flag:', downloadUrl.includes('fl_attachment'));
console.log('- Proper format:', downloadUrl.endsWith('.pdf'));

console.log('\n=== CLOUDINARY ACCOUNT CHECK ===');
console.log('If 401 errors persist, check:');
console.log('1. Cloudinary account settings for public access restrictions');
console.log('2. API key permissions');
console.log('3. Account security settings');
console.log('4. Resource access policies');

console.log('\n=== TEST COMPLETE ===');
