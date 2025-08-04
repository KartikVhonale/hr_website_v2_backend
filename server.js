// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { validateAllConfigurations } = require('./config/env-validation');

// Security middleware imports
const {
  generalLimiter,
  securityHeaders,
  mongoSanitization,
  parameterPollutionPrevention,
  requestSizeLimit,
  securityLogger,
  corsSecurityCheck
} = require('./middleware/security-middleware');
const { sanitizeInput } = require('./middleware/validation-middleware');
const {
  globalErrorHandler,
  notFound,
  handleFileUploadError,
  handleUnhandledRejection,
  handleUncaughtException
} = require('./middleware/error-middleware');
const authRouter = require('./router/auth-router');
const jobRouter = require('./router/job-router');
const applicationRouter = require('./router/application-router');
const articleRouter = require('./router/article-router');
const contactRouter = require('./router/contact-router');
const teamRouter = require('./router/team-router');
const activityRouter = require('./router/activity-router');
const userRouter = require('./router/user-router');
const jobseekerRouter = require('./router/jobseeker-router');
const employerRouter = require('./router/employer-router');
const adminRouter = require('./router/admin-router');
const notificationRouter = require('./router/notification-router');

// Validate environment configuration
validateAllConfigurations();

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException();
handleUnhandledRejection();

// Connect to database
connectDB();

const app = express();
const port = process.env.PORT || 3000;

// Security Middleware (applied first)
app.use(securityHeaders); // Security headers
app.use(securityLogger); // Security logging
app.use(corsSecurityCheck); // CORS security check
app.use(requestSizeLimit); // Request size limiting

// Configure CORS with specific options
app.use(cors({
  origin: [
    'http://localhost:5173', // Local frontend development
    'http://localhost:5174',
    'https://hr-website-v2.vercel.app', // Replace with your frontend domain
    process.env.FRONTEND_URL // Optional: configure via environment variable
  ].filter(Boolean), // Remove undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Body parsing middleware with size limits
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  parameterLimit: 20 // Limit number of parameters
}));

// Security middleware (applied after body parsing)
app.use(mongoSanitization); // Prevent NoSQL injection
app.use(parameterPollutionPrevention); // Prevent parameter pollution
app.use(sanitizeInput); // XSS protection
app.use(generalLimiter); // General rate limiting

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'TalentFlow API Server',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    message: 'API Test Successful',
    data: {
      name: 'John Doe',
      email: 'john.doe@example.com',
    },
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobRouter);
app.use('/api/applications', applicationRouter);
app.use('/api/articles', articleRouter);
app.use('/api/contact', contactRouter);
app.use('/api/team', teamRouter);
app.use('/api/activity', activityRouter);
app.use('/api/users', userRouter);
app.use('/api/jobseeker', jobseekerRouter);
app.use('/api/employer', employerRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationRouter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Serve frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('API is running....');
  });
}

// File upload error handling
app.use(handleFileUploadError);

// 404 handler for undefined routes
app.use(notFound);

// Global error handling middleware (must be last)
app.use(globalErrorHandler);

app.listen(port, () => {
  console.log(`TalentFlow API Server listening on port ${port}`);
  console.log(`Server running at http://localhost:${port}`);
});
