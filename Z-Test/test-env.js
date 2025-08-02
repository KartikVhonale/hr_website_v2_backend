console.log('🔍 Environment Variable Test');
console.log('============================');

const requiredVars = [
  'JWT_SECRET',
  'MONGODB_URI',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

console.log('\n📋 Environment Variables Status:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Show first few characters for security
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`✅ ${varName}: ${preview}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n🔧 Additional Info:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`PORT: ${process.env.PORT || 'not set'}`);

// Test MongoDB URI specifically
if (process.env.MONGODB_URI) {
  console.log('\n🔗 MongoDB URI Analysis:');
  const uri = process.env.MONGODB_URI;
  console.log(`✅ URI is defined`);
  console.log(`✅ Length: ${uri.length} characters`);
  console.log(`✅ Starts with: ${uri.substring(0, 10)}...`);
  
  if (uri.includes('mongodb+srv://')) {
    console.log('✅ Using MongoDB Atlas (SRV format)');
  } else if (uri.includes('mongodb://')) {
    console.log('✅ Using standard MongoDB connection');
  } else {
    console.log('❌ Invalid MongoDB URI format');
  }
} else {
  console.log('\n❌ MONGODB_URI is not defined!');
}

console.log('\n✅ Environment test completed');
