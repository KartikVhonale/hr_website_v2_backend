require('dotenv').config();
const mongoose = require('mongoose');
const Jobseeker = require('./models/Jobseeker');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for migration');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Migration function to update resume URLs
const migrateResumeUrls = async () => {
  try {
    console.log('=== RESUME URL MIGRATION ===');
    
    // Find all jobseekers with resumes that have raw URLs
    const jobseekersWithRawUrls = await Jobseeker.find({
      'resume.url': { $regex: '/raw/upload/' }
    });

    console.log(`Found ${jobseekersWithRawUrls.length} resumes with raw URLs to migrate`);

    if (jobseekersWithRawUrls.length === 0) {
      console.log('No resumes need migration');
      return;
    }

    let migratedCount = 0;

    for (const jobseeker of jobseekersWithRawUrls) {
      const oldUrl = jobseeker.resume.url;
      const newUrl = oldUrl.replace('/raw/upload/', '/image/upload/');
      
      console.log(`\nMigrating resume for user ${jobseeker.userId}:`);
      console.log(`  Old URL: ${oldUrl}`);
      console.log(`  New URL: ${newUrl}`);

      // Update the URL
      jobseeker.resume.url = newUrl;
      await jobseeker.save();
      
      migratedCount++;
      console.log(`  ✅ Migrated successfully`);
    }

    console.log(`\n=== MIGRATION COMPLETE ===`);
    console.log(`Successfully migrated ${migratedCount} resume URLs`);

  } catch (error) {
    console.error('Migration error:', error);
  }
};

// Run migration
const runMigration = async () => {
  await connectDB();
  await migrateResumeUrls();
  await mongoose.connection.close();
  console.log('Database connection closed');
};

// Execute if run directly
if (require.main === module) {
  runMigration();
}

module.exports = { migrateResumeUrls };
