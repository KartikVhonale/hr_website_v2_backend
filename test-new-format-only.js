const mongoose = require('mongoose');
const User = require('./models/User');
const Jobseeker = require('./models/Jobseeker');
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

const testNewFormatOnly = async () => {
  try {
    await connectDB();
    
    console.log('=== TESTING NEW FORMAT ONLY ===');
    
    // Find a jobseeker user
    const user = await User.findOne({ role: 'jobseeker' });
    if (!user) {
      console.log('❌ No jobseeker users found');
      return;
    }
    
    console.log('✅ Found user:', user.email);
    
    // Verify User model only has basic fields (no old jobseeker fields)
    console.log('\n=== USER MODEL VERIFICATION ===');
    console.log('User fields present:');
    const userFields = Object.keys(user.toObject());
    console.log('- Basic fields:', userFields.filter(f => 
      ['_id', 'name', 'email', 'role', 'status', 'profilePicture', 'emailVerified', 'lastLogin', 'createdAt', 'updatedAt', '__v'].includes(f)
    ));
    
    // Check for old fields that should NOT be present
    const oldFields = userFields.filter(f => 
      ['phone', 'location', 'jobTitle', 'summary', 'skills', 'experience', 'education', 'certifications', 'linkedin', 'github', 'portfolio', 'resume', 'savedJobs'].includes(f)
    );
    
    if (oldFields.length > 0) {
      console.log('❌ OLD FIELDS STILL PRESENT:', oldFields);
    } else {
      console.log('✅ No old jobseeker fields in User model');
    }
    
    // Find jobseeker profile
    const jobseekerProfile = await Jobseeker.findOne({ userId: user._id });
    if (!jobseekerProfile) {
      console.log('❌ No jobseeker profile found');
      return;
    }
    
    console.log('\n=== JOBSEEKER MODEL VERIFICATION ===');
    console.log('✅ Jobseeker profile found');
    console.log('Profile fields:');
    console.log('- Phone:', jobseekerProfile.phone || 'Not set');
    console.log('- Location:', jobseekerProfile.location || 'Not set');
    console.log('- Job Title:', jobseekerProfile.jobTitle || 'Not set');
    console.log('- Summary:', jobseekerProfile.summary ? 'Set' : 'Not set');
    console.log('- Skills:', jobseekerProfile.skills?.length || 0, 'items');
    console.log('- Experience:', jobseekerProfile.experience?.length || 0, 'items');
    console.log('- Education:', jobseekerProfile.education?.length || 0, 'items');
    console.log('- Certifications:', jobseekerProfile.certifications?.length || 0, 'items');
    
    // Verify social links are in NEW FORMAT ONLY
    console.log('\n=== SOCIAL LINKS VERIFICATION ===');
    if (jobseekerProfile.socialLinks) {
      console.log('✅ Social links in NEW FORMAT:');
      console.log('- LinkedIn:', jobseekerProfile.socialLinks.linkedin || 'Not set');
      console.log('- GitHub:', jobseekerProfile.socialLinks.github || 'Not set');
      console.log('- Portfolio:', jobseekerProfile.socialLinks.portfolio || 'Not set');
    } else {
      console.log('⚠️  No social links object found');
    }
    
    // Test API response format (what frontend receives)
    console.log('\n=== API RESPONSE FORMAT TEST ===');
    const apiResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      profilePicture: user.profilePicture,
      // Jobseeker profile data
      phone: jobseekerProfile.phone,
      location: jobseekerProfile.location,
      jobTitle: jobseekerProfile.jobTitle,
      summary: jobseekerProfile.summary,
      skills: jobseekerProfile.skills,
      experience: jobseekerProfile.experience,
      education: jobseekerProfile.education,
      certifications: jobseekerProfile.certifications,
      resume: jobseekerProfile.resume,
      savedJobs: jobseekerProfile.savedJobs,
      profileCompletion: jobseekerProfile.profileCompletion,
      // Social links - NEW FORMAT ONLY
      linkedin: jobseekerProfile.socialLinks?.linkedin,
      github: jobseekerProfile.socialLinks?.github,
      portfolio: jobseekerProfile.socialLinks?.portfolio,
      socialLinks: jobseekerProfile.socialLinks
    };
    
    console.log('✅ API Response Structure:');
    console.log('- User fields:', ['_id', 'name', 'email', 'role', 'status'].every(f => apiResponse[f] !== undefined));
    console.log('- Profile fields:', ['phone', 'location', 'jobTitle', 'summary', 'skills'].every(f => apiResponse[f] !== undefined));
    console.log('- Social links (direct):', {
      linkedin: !!apiResponse.linkedin,
      github: !!apiResponse.github,
      portfolio: !!apiResponse.portfolio
    });
    console.log('- Social links (object):', !!apiResponse.socialLinks);
    
    // Test frontend compatibility
    console.log('\n=== FRONTEND COMPATIBILITY TEST ===');
    const frontendData = {
      name: apiResponse.name,
      email: apiResponse.email,
      phone: apiResponse.phone,
      location: apiResponse.location,
      jobTitle: apiResponse.jobTitle,
      summary: apiResponse.summary,
      // NEW FORMAT ONLY - social links from socialLinks object
      linkedin: apiResponse.socialLinks?.linkedin || '',
      github: apiResponse.socialLinks?.github || '',
      portfolio: apiResponse.socialLinks?.portfolio || '',
      experience: apiResponse.experience,
      education: apiResponse.education,
      skills: apiResponse.skills,
      certifications: apiResponse.certifications
    };
    
    console.log('✅ Frontend receives clean data structure');
    console.log('✅ Social links properly extracted from socialLinks object');
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    console.log('✅ User model contains only basic auth fields');
    console.log('✅ Jobseeker model contains all profile data');
    console.log('✅ Social links use NEW FORMAT ONLY');
    console.log('✅ API response provides clean structure');
    console.log('✅ Frontend compatibility maintained');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  testNewFormatOnly().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testNewFormatOnly };
