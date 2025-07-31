const mongoose = require('mongoose');
require('dotenv').config();

const cleanupUserFields = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const result = await db.collection('users').updateMany(
      {},
      {
        $unset: {
          skills: 1,
          phone: 1,
          location: 1,
          jobTitle: 1,
          summary: 1,
          experience: 1,
          education: 1,
          certifications: 1,
          linkedin: 1,
          github: 1,
          portfolio: 1,
          resume: 1,
          savedJobs: 1,
          savedCandidates: 1,
          company: 1
        }
      }
    );
    
    console.log('Cleaned up', result.modifiedCount, 'user records');
    console.log('Removed all old jobseeker fields from User collection');
    
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    process.exit(0);
  }
};

cleanupUserFields();
