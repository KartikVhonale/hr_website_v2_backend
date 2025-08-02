// Debug environment loading
console.log('🔍 Debugging Environment Loading');
console.log('================================');

console.log('\n1️⃣ Before loading dotenv:');
console.log(`MONGODB_URI: ${process.env.MONGODB_URI || 'undefined'}`);

console.log('\n2️⃣ Loading dotenv...');
const dotenvResult = require('dotenv').config();

// Check if we're in production mode
if (process.env.NODE_ENV === 'production') {
  console.log('🌐 Running in production mode - using platform environment variables');
}

console.log('\n3️⃣ Dotenv result:');
console.log('Error:', dotenvResult.error || 'none');
console.log('Parsed keys:', dotenvResult.parsed ? Object.keys(dotenvResult.parsed) : 'none');

console.log('\n4️⃣ After loading dotenv:');
console.log(`MONGODB_URI: ${process.env.MONGODB_URI || 'undefined'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET || 'undefined'}`);

console.log('\n5️⃣ Current working directory:');
console.log(process.cwd());

console.log('\n6️⃣ Checking .env file existence:');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
console.log(`Looking for .env at: ${envPath}`);

try {
  const envExists = fs.existsSync(envPath);
  console.log(`File exists: ${envExists}`);
  
  if (envExists) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log(`File size: ${envContent.length} bytes`);
    console.log('First 100 characters:', envContent.substring(0, 100));
  }
} catch (error) {
  console.error('Error checking .env file:', error.message);
}

console.log('\n✅ Debug completed');
