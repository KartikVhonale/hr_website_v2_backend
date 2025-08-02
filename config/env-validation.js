// Environment variable validation
const validateEnvironment = () => {
  console.log('🔍 Checking environment variables...');

  const requiredEnvVars = [
    'JWT_SECRET',
    'MONGODB_URI',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];

  // Check each variable and provide detailed feedback
  const missingVars = [];
  const presentVars = [];

  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    } else {
      presentVars.push(varName);
      console.log(`✅ ${varName}: Set`);
    }
  });

  if (missingVars.length > 0) {
    console.warn('\n⚠️  Missing environment variables:');
    missingVars.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
    console.warn('\n💡 Make sure all environment variables are set in your deployment platform');
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET should be at least 32 characters long for security.');
  }

  // Validate MongoDB URI format
  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.startsWith('mongodb')) {
    console.warn('⚠️  MONGODB_URI should be a valid MongoDB connection string.');
  }

  // Validate NODE_ENV
  const validEnvironments = ['development', 'production', 'test'];
  if (process.env.NODE_ENV && !validEnvironments.includes(process.env.NODE_ENV)) {
    console.warn(`⚠️  NODE_ENV "${process.env.NODE_ENV}" is not recognized. Valid values: ${validEnvironments.join(', ')}`);
  }

  // Set default NODE_ENV if not provided
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
    console.log('ℹ️  NODE_ENV not set, defaulting to "development"');
  }

  // Validate PORT
  if (process.env.PORT && (isNaN(process.env.PORT) || process.env.PORT < 1 || process.env.PORT > 65535)) {
    console.error('❌ PORT must be a valid port number (1-65535).');
    process.exit(1);
  }

  console.log('✅ Environment validation passed');
};

// Security configuration validation
const validateSecurityConfig = () => {
  const warnings = [];

  // Check if running in production with development settings
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.FRONTEND_URL) {
      warnings.push('FRONTEND_URL should be set in production for CORS security');
    }

    if (process.env.JWT_SECRET === 'your-super-secret-jwt-key') {
      console.error('❌ Default JWT_SECRET detected in production! Please use a secure secret.');
      process.exit(1);
    }
  }

  // Display warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Security warnings:');
    warnings.forEach(warning => {
      console.warn(`   - ${warning}`);
    });
  }
};

// Database configuration validation
const validateDatabaseConfig = () => {
  // Check if MongoDB URI contains credentials in production
  if (process.env.NODE_ENV === 'production' && process.env.MONGODB_URI.includes('localhost')) {
    console.warn('⚠️  Using localhost MongoDB in production. Consider using a cloud database.');
  }
};

// Cloudinary configuration validation
const validateCloudinaryConfig = () => {
  const cloudinaryVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  
  cloudinaryVars.forEach(varName => {
    if (process.env[varName] && process.env[varName].length < 10) {
      console.warn(`⚠️  ${varName} seems too short. Please verify your Cloudinary credentials.`);
    }
  });
};

// Complete validation function
const validateAllConfigurations = () => {
  console.log('🔍 Validating environment configuration...');
  
  validateEnvironment();
  validateSecurityConfig();
  validateDatabaseConfig();
  validateCloudinaryConfig();
  
  console.log('✅ All configuration validations completed');
};

module.exports = {
  validateEnvironment,
  validateSecurityConfig,
  validateDatabaseConfig,
  validateCloudinaryConfig,
  validateAllConfigurations
};
