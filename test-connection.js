require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 MongoDB Connection Test');
console.log('==========================');

// Check environment variable
console.log('\n📋 Environment Check:');
if (process.env.MONGODB_URI) {
  console.log('✅ MONGODB_URI is defined');
  console.log(`✅ Length: ${process.env.MONGODB_URI.length} characters`);
} else {
  console.log('❌ MONGODB_URI is NOT defined');
  console.log('💡 Make sure your .env file is in the backend directory');
  console.log('💡 Make sure the variable name is exactly "MONGODB_URI"');
  process.exit(1);
}

// Test connection
async function testConnection() {
  try {
    console.log('\n🔗 Attempting MongoDB connection...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    
    console.log('✅ MongoDB connection successful!');
    console.log(`✅ Connected to: ${conn.connection.host}`);
    console.log(`✅ Database: ${conn.connection.name}`);
    
    // Test ping
    await conn.connection.db.admin().command({ ping: 1 });
    console.log('✅ Ping successful!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ Connection closed');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('💡 DNS resolution failed - check your internet connection');
    } else if (error.message.includes('authentication failed')) {
      console.error('💡 Authentication failed - check username/password');
    } else if (error.message.includes('timeout')) {
      console.error('💡 Connection timeout - check network/firewall');
    }
    
    process.exit(1);
  }
}

testConnection();
