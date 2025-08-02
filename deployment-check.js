/**
 * Deployment Environment Check
 * Run this to verify all required environment variables are set
 */

console.log('🔍 Checking deployment environment...\n');

// Required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'NODE_ENV'
];

// Optional but recommended environment variables
const optionalEnvVars = [
  'PORT',
  'JWT_EXPIRE',
  'CORS_ORIGIN',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

let allGood = true;

console.log('📋 Required Environment Variables:');
console.log('=====================================');

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${envVar === 'MONGODB_URI' || envVar === 'JWT_SECRET' ? '[HIDDEN]' : value}`);
  } else {
    console.log(`❌ ${envVar}: NOT SET`);
    allGood = false;
  }
});

console.log('\n📋 Optional Environment Variables:');
console.log('===================================');

optionalEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${['EMAIL_PASS', 'CLOUDINARY_API_SECRET'].includes(envVar) ? '[HIDDEN]' : value}`);
  } else {
    console.log(`⚠️  ${envVar}: NOT SET (optional)`);
  }
});

console.log('\n🌐 Server Configuration:');
console.log('========================');
console.log(`🚀 Port: ${process.env.PORT || 3000}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📡 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);

console.log('\n📊 Summary:');
console.log('===========');

if (allGood) {
  console.log('🎉 All required environment variables are set!');
  console.log('✅ Ready for deployment');
} else {
  console.log('❌ Some required environment variables are missing');
  console.log('💡 Please set the missing variables in your Render dashboard');
  process.exit(1);
}

console.log('\n🔗 Useful Links:');
console.log('================');
console.log('📖 Render Environment Variables: https://render.com/docs/environment-variables');
console.log('🔧 MongoDB Atlas: https://cloud.mongodb.com/');
console.log('☁️  Cloudinary Dashboard: https://cloudinary.com/console');

console.log('\n🚀 Deployment completed successfully!');
