const mongoose = require('mongoose');
const { ServerApiVersion } = require('mongodb');

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      retryWrites: true,
      w: 'majority'
    });

    // Send a ping to confirm a successful connection
    await conn.connection.db.admin().command({ ping: 1 });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log('✅ Pinged your deployment. You successfully connected to MongoDB!');
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);

    // Provide helpful error messages for common issues
    if (error.message.includes('ENOTFOUND')) {
      console.error('💡 Check your internet connection and MongoDB cluster URL');
    } else if (error.message.includes('authentication failed')) {
      console.error('💡 Check your MongoDB username and password');
    } else if (error.message.includes('timeout')) {
      console.error('💡 Check your network connection and MongoDB cluster status');
    }

    process.exit(1);
  }
};

module.exports = connectDB;
