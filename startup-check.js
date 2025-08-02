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

// Step 3: Check .env file
console.log('\n3️⃣ Environment File Check:');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
console.log(`Looking for .env at: ${envPath}`);

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.error('💡 Creating a sample .env file...');
  
  const sampleEnv = `PORT=3000
MONGODB_URI=mongodb+srv://test112:JEcoBTGRUw9S1Puu@cluster0.tmdvjpl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-2024-kartik-is-doing-well
CLOUDINARY_CLOUD_NAME=dr4uuk5x0
CLOUDINARY_API_KEY=727498514571799
CLOUDINARY_API_SECRET=8SSGr4EX7HplPUfVtyF8Nx5qUEQ
NODE_ENV=development
`;
  
  try {
    fs.writeFileSync(envPath, sampleEnv);
    console.log('✅ Sample .env file created');
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
  }
} else {
  console.log('✅ .env file found');
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log(`File size: ${envContent.length} bytes`);
    
    // Check for required variables
    const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME'];
    requiredVars.forEach(varName => {
      if (envContent.includes(varName)) {
        console.log(`✅ ${varName} found in file`);
      } else {
        console.log(`❌ ${varName} missing from file`);
      }
    });
  } catch (error) {
    console.error('❌ Error reading .env file:', error.message);
  }
}

// Step 4: Load environment variables
console.log('\n4️⃣ Loading Environment Variables:');
const dotenv = require('dotenv');
const result = dotenv.config();

if (result.error) {
  if (process.env.NODE_ENV === 'production') {
    console.log('🌐 Running in production mode - using platform environment variables');
    console.log('ℹ️  .env file not needed in production');
  } else {
    console.error('❌ Error loading .env:', result.error.message);
  }
} else {
  console.log('✅ Environment variables loaded');
  if (result.parsed) {
    console.log(`Loaded ${Object.keys(result.parsed).length} variables`);
  }
}

// Step 5: Validate critical variables
console.log('\n5️⃣ Environment Variable Validation:');
const criticalVars = {
  'MONGODB_URI': process.env.MONGODB_URI,
  'JWT_SECRET': process.env.JWT_SECRET,
  'CLOUDINARY_CLOUD_NAME': process.env.CLOUDINARY_CLOUD_NAME,
  'CLOUDINARY_API_KEY': process.env.CLOUDINARY_API_KEY,
  'CLOUDINARY_API_SECRET': process.env.CLOUDINARY_API_SECRET
};

let allValid = true;
Object.entries(criticalVars).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key}: Set (${value.length} chars)`);
  } else {
    console.log(`❌ ${key}: NOT SET`);
    allValid = false;
  }
});

// Step 6: Test MongoDB connection
if (allValid && process.env.MONGODB_URI) {
  console.log('\n6️⃣ Testing MongoDB Connection:');
  
  const mongoose = require('mongoose');
  
  async function testMongoDB() {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
      
      console.log('✅ MongoDB connection successful!');
      await mongoose.connection.close();
      console.log('✅ Connection closed');
      
      console.log('\n🎉 All checks passed! Your backend should start successfully.');
      console.log('\n🚀 To start the server, run: npm run dev');
      
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
  console.log('\n❌ Cannot test MongoDB - missing environment variables');
  console.log('\n🔧 Please fix the missing environment variables and run this check again.');
}
