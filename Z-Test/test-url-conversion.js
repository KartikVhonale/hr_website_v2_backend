// Test URL conversion for existing resumes
const testUrl = 'https://res.cloudinary.com/dr4uuk5x0/raw/upload/v1753966102/talentflow/resumes/resume_resume2_1753966099147.pdf';

console.log('=== URL CONVERSION TEST ===');
console.log('Original URL:', testUrl);

// Manual conversion (same logic as pdfUtils.js)
function convertRawToImage(url) {
  if (!url) return url;
  
  if (url.includes('/raw/upload/')) {
    const converted = url.replace('/raw/upload/', '/image/upload/');
    console.log('Converted URL:', converted);
    return converted;
  }
  
  console.log('URL already in correct format');
  return url;
}

const convertedUrl = convertRawToImage(testUrl);

console.log('\n=== TESTING BOTH URLS ===');
console.log('Original (raw):', testUrl);
console.log('Converted (image):', convertedUrl);

console.log('\n=== URL ANALYSIS ===');
console.log('Original has /raw/upload/:', testUrl.includes('/raw/upload/'));
console.log('Converted has /image/upload/:', convertedUrl.includes('/image/upload/'));
console.log('Both have same path after upload/:', 
  testUrl.split('/upload/')[1] === convertedUrl.split('/upload/')[1]);
