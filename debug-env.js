// Debug environment variables
console.log('🔍 Environment Variables Debug');
console.log('==============================');

console.log('\n📋 Environment Variables Status:');
console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
console.log(`PORT: ${process.env.PORT || 'Not set'}`);

console.log('\n✅ Environment debug completed');
