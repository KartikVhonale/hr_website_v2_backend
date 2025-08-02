const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(15 * 60 / 60) // minutes
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.log(`Rate limit exceeded for IP: ${req.ip} on ${req.originalUrl}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60 / 60)
    });
  }
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: Math.ceil(15 * 60 / 60)
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    console.log(`Auth rate limit exceeded for IP: ${req.ip} on ${req.originalUrl}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60 / 60)
    });
  }
});

// Rate limiting for password reset attempts
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
    retryAfter: Math.ceil(60 * 60 / 60)
  },
  handler: (req, res) => {
    console.log(`Password reset rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts from this IP, please try again later.',
      retryAfter: Math.ceil(60 * 60 / 60)
    });
  }
});

// Rate limiting for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 upload requests per windowMs
  message: {
    success: false,
    message: 'Too many upload attempts, please try again later.',
    retryAfter: Math.ceil(15 * 60 / 60)
  },
  handler: (req, res) => {
    console.log(`Upload rate limit exceeded for IP: ${req.ip} on ${req.originalUrl}`);
    res.status(429).json({
      success: false,
      message: 'Too many upload attempts from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60 / 60)
    });
  }
});

// Rate limiting for job creation (employers)
const jobCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 job postings per hour
  message: {
    success: false,
    message: 'Too many job postings, please try again later.',
    retryAfter: Math.ceil(60 * 60 / 60)
  },
  handler: (req, res) => {
    console.log(`Job creation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many job postings from this IP, please try again later.',
      retryAfter: Math.ceil(60 * 60 / 60)
    });
  }
});

// Security headers configuration
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://via.placeholder.com"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for Cloudinary compatibility
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
});

// MongoDB injection prevention
const mongoSanitization = mongoSanitize({
  replaceWith: '_', // Replace prohibited characters with underscore
  onSanitize: ({ req, key }) => {
    console.warn(`Potential MongoDB injection attempt detected from IP: ${req.ip}, key: ${key}`);
  }
});

// HTTP Parameter Pollution prevention
const parameterPollutionPrevention = hpp({
  whitelist: ['skills', 'category'] // Allow arrays for these parameters
});

// Request size limiting middleware
const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.get('Content-Length'));
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength && contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large. Maximum size is 10MB.'
    });
  }
  
  next();
};

// IP whitelist middleware (for admin endpoints in production)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'production' && allowedIPs.length > 0) {
      const clientIP = req.ip || req.connection.remoteAddress;
      
      if (!allowedIPs.includes(clientIP)) {
        console.warn(`Unauthorized IP access attempt: ${clientIP} on ${req.originalUrl}`);
        return res.status(403).json({
          success: false,
          message: 'Access denied from this IP address.'
        });
      }
    }
    next();
  };
};

// Security logging middleware
const securityLogger = (req, res, next) => {
  // Skip security logging in development environment for legitimate API calls
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // Log suspicious activities - Updated to be less aggressive
  const suspiciousPatterns = [
    /(\<script\>|\<\/script\>)/i, // XSS attempts
    /(union\s+select|insert\s+into|delete\s+from|drop\s+table|create\s+table|alter\s+table)/i, // SQL injection (more specific)
    /(javascript:|data:text\/html|vbscript:)/i, // Dangerous protocols
    /(\$where|\$eval)/i, // Only dangerous MongoDB operators
    /(eval\(|function\(|setTimeout\(|setInterval\()/i, // JavaScript injection
  ];

  // Skip security logging for legitimate API endpoints
  const skipPaths = [
    '/api/jobs',
  ];

  const shouldSkip = skipPaths.some(path => req.originalUrl.startsWith(path));

  if (!shouldSkip) {
    const requestData = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params
    });

    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(requestData)) {
        console.warn(`Suspicious request detected from IP: ${req.ip}`, {
          url: req.originalUrl,
          method: req.method,
          userAgent: req.get('User-Agent'),
          data: requestData
        });
      }
    });
  }

  next();
};

// CORS security enhancement
const corsSecurityCheck = (req, res, next) => {
  const origin = req.get('Origin');
  const allowedOrigins = [
    'http://localhost:5173',
    'https://hr-website-v2.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean);
  
  // Check for suspicious origins in production
  if (process.env.NODE_ENV === 'production' && origin && !allowedOrigins.includes(origin)) {
    console.warn(`Suspicious origin detected: ${origin} from IP: ${req.ip}`);
  }
  
  next();
};

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  uploadLimiter,
  jobCreationLimiter,
  securityHeaders,
  mongoSanitization,
  parameterPollutionPrevention,
  requestSizeLimit,
  ipWhitelist,
  securityLogger,
  corsSecurityCheck
};
