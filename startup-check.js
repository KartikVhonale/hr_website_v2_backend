#!/usr/bin/env node

console.log('🚀 HR Website Backend Startup Check');
console.log('===================================');

// Step 1: Check Node.js version
console.log('\n1️⃣ Node.js Environment:');
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);

// Step 2: Check working directory
console.log('\n2️⃣ Working Directory:');
console.log(`Current directory: ${process.cwd()}`);

// Step 3: Check Environment Variables
console.log('\n3️⃣ Environment Variables Check:');

const criticalVars = ['MONGODB_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

let allValid = true;
criticalVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: Not set`);
    allValid = false;
  }
});

// Step 4: Test MongoDB connection
if (allValid && process.env.MONGODB_URI) {
  console.log('\n4️⃣ Testing MongoDB Connection:');
  
  const mongoose = require('mongoose');
  
  async function testMongoDB() {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
      
      console.log('✅ MongoDB connection successful!');
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
      
      console.log('\n🎉 All checks passed! Your backend should start successfully.');
      console.log('\n🚀 To start the server, run: npm start');
      
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      console.log('\n🔧 Troubleshooting tips:');
      console.log('1. Check your internet connection');
      console.log('2. Verify MongoDB Atlas cluster is running');
      console.log('3. Check username/password in connection string');
      console.log('4. Ensure IP address is whitelisted in MongoDB Atlas');
    }
  }
  
  testMongoDB();
} else {
  console.log('\n⚠️  Skipping MongoDB test due to missing environment variables');
  console.log('\n🔧 Please set all required environment variables and run this check again.');
}

console.log('\n🎉 Startup check completed!');
