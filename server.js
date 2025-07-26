require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRouter = require('./router/auth-router');
const jobRouter = require('./router/job-router');
const applicationRouter = require('./router/application-router');
const articleRouter = require('./router/article-router');
const contactRouter = require('./router/contact-router');
const teamRouter = require('./router/team-router');

// Connect to database
connectDB();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
// Configure CORS with specific options
app.use(cors({
  origin: [
    'http://localhost:5173', // Local frontend development
    'https://hr-website-v2.vercel.app', // Replace with your frontend domain
    process.env.FRONTEND_URL // Optional: configure via environment variable
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

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
app.use('/api/contacts', contactRouter);
app.use('/api/team', teamRouter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(port, () => {
  console.log(`TalentFlow API Server listening on port ${port}`);
  console.log(`Server running at http://localhost:${port}`);
});
