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

const migrateJobseekerData = async () => {
  try {
    console.log('Starting jobseeker data migration...');
    
    // Find all users with jobseeker role
    const jobseekers = await User.find({ role: 'jobseeker' });
    console.log(`Found ${jobseekers.length} jobseeker users to migrate`);

    let migrated = 0;
    let skipped = 0;

    for (const user of jobseekers) {
      try {
        // Check if jobseeker profile already exists
        const existingProfile = await Jobseeker.findOne({ userId: user._id });
        if (existingProfile) {
          console.log(`Skipping user ${user.email} - profile already exists`);
          skipped++;
          continue;
        }

        // Create new jobseeker profile
        const jobseekerData = {
          userId: user._id,
          phone: user.phone || '',
          location: user.location || '',
          jobTitle: user.jobTitle || '',
          summary: user.summary || '',
          skills: user.skills || [],
          experience: user.experience || [],
          education: user.education || [],
          certifications: user.certifications || [],
          socialLinks: {
            linkedin: user.linkedin || '',
            github: user.github || '',
            portfolio: user.portfolio || ''
          },
          resume: user.resume || null,
          savedJobs: user.savedJobs || []
        };

        const newJobseekerProfile = new Jobseeker(jobseekerData);
        await newJobseekerProfile.save();

        console.log(`Migrated profile for user: ${user.email}`);
        migrated++;

      } catch (error) {
        console.error(`Error migrating user ${user.email}:`, error.message);
      }
    }

    console.log(`Migration completed:`);
    console.log(`- Migrated: ${migrated} profiles`);
    console.log(`- Skipped: ${skipped} profiles`);
    console.log(`- Total: ${jobseekers.length} users processed`);

  } catch (error) {
    console.error('Migration failed:', error);
  }
};

const cleanupUserModel = async () => {
  try {
    console.log('Starting User model cleanup...');
    
    // Remove ALL jobseeker-specific fields from User model
    const result = await User.updateMany(
      {},
      {
        $unset: {
          phone: 1,
          location: 1,
          jobTitle: 1,
          summary: 1,
          skills: 1,
          experience: 1,
          education: 1,
          certifications: 1,
          linkedin: 1,
          github: 1,
          portfolio: 1,
          resume: 1,
          savedJobs: 1,
          savedCandidates: 1,
          company: 1 // This was for employers anyway
        }
      }
    );

    console.log(`Cleaned up ${result.modifiedCount} user records`);
    
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
};

const runMigration = async () => {
  await connectDB();
  
  console.log('=== JOBSEEKER DATA MIGRATION ===');
  console.log('This script will:');
  console.log('1. Create Jobseeker profiles for all existing jobseeker users');
  console.log('2. Migrate jobseeker-specific data from User to Jobseeker model');
  console.log('3. Clean up jobseeker fields from User model');
  console.log('');
  
  // Step 1: Migrate data
  await migrateJobseekerData();
  
  console.log('');
  console.log('=== CLEANUP PHASE ===');
  
  // Step 2: Clean up User model - REMOVE OLD FIELDS
  await cleanupUserModel();
  
  console.log('Migration completed successfully!');
  console.log('');
  console.log('IMPORTANT NOTES:');
  console.log('- User model cleanup is commented out for safety');
  console.log('- Uncomment cleanupUserModel() call if you want to remove old fields');
  console.log('- Test thoroughly before running cleanup in production');
  
  process.exit(0);
};

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = {
  migrateJobseekerData,
  cleanupUserModel,
  runMigration
};
