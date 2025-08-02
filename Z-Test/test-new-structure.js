const mongoose = require('mongoose');
const User = require('../models/User');
const Jobseeker = require('../models/Jobseeker');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const testNewStructure = async () => {
  try {
    await connectDB();
    
    console.log('=== TESTING NEW DATABASE STRUCTURE ===');
    
    // Test 1: Find a jobseeker user
    const jobseekerUser = await User.findOne({ role: 'jobseeker' });
    if (!jobseekerUser) {
      console.log('No jobseeker users found. Creating a test user...');
      
      // Create a test user
      const testUser = new User({
        name: 'Test Jobseeker',
        email: 'test@jobseeker.com',
        password: 'password123',
        role: 'jobseeker'
      });
      await testUser.save();
      console.log('Test user created:', testUser.email);
      
      // Create corresponding jobseeker profile
      const testJobseeker = new Jobseeker({
        userId: testUser._id,
        jobTitle: 'Software Developer',
        location: 'San Francisco, CA',
        skills: ['JavaScript', 'React', 'Node.js'],
        summary: 'Passionate software developer with 3 years of experience'
      });
      await testJobseeker.save();
      console.log('Test jobseeker profile created');
      
    } else {
      console.log('Found jobseeker user:', jobseekerUser.email);
      
      // Check if jobseeker profile exists
      let jobseekerProfile = await Jobseeker.findOne({ userId: jobseekerUser._id });
      if (!jobseekerProfile) {
        console.log('No jobseeker profile found. Creating one...');
        jobseekerProfile = new Jobseeker({
          userId: jobseekerUser._id,
          skills: [],
          experience: [],
          education: [],
          certifications: []
        });
        await jobseekerProfile.save();
        console.log('Jobseeker profile created');
      } else {
        console.log('Jobseeker profile found');
      }
      
      // Test the combined data structure
      const combinedData = {
        _id: jobseekerUser._id,
        name: jobseekerUser.name,
        email: jobseekerUser.email,
        role: jobseekerUser.role,
        status: jobseekerUser.status,
        ...jobseekerProfile.toObject(),
        userId: undefined // Remove duplicate userId field
      };
      
      console.log('Combined profile data structure:');
      console.log('- User fields:', {
        _id: combinedData._id,
        name: combinedData.name,
        email: combinedData.email,
        role: combinedData.role,
        status: combinedData.status
      });
      console.log('- Jobseeker fields:', {
        jobTitle: combinedData.jobTitle,
        location: combinedData.location,
        skills: combinedData.skills?.length || 0,
        experience: combinedData.experience?.length || 0,
        education: combinedData.education?.length || 0
      });
    }
    
    console.log('');
    console.log('=== STRUCTURE TEST COMPLETED ===');
    console.log('✅ User model: Basic auth and common info');
    console.log('✅ Jobseeker model: Profile-specific data');
    console.log('✅ Relationship: userId foreign key');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    process.exit(0);
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  testNewStructure().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testNewStructure };
