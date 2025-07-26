const mongoose = require('mongoose');
const { ServerApiVersion } = require('mongodb');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
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
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
