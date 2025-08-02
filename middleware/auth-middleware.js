const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    // Validate JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Additional token validation
    if (!decoded.userId || !decoded.email || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token structure.'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);

    // Provide specific error messages for different JWT errors
    let message = 'Invalid or expired token.';
    if (error.name === 'TokenExpiredError') {
      message = 'Token has expired. Please login again.';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token format.';
    }

    res.status(401).json({
      success: false,
      message
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};

// Middleware to check if user is employer
const requireEmployer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (req.user.role !== 'employer' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Employer privileges required.'
    });
  }

  next();
};

// Middleware to check if user is jobseeker
const requireJobseeker = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (req.user.role !== 'jobseeker' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Jobseeker privileges required.'
    });
  }

  next();
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token is invalid, but we don't fail the request
      console.log('Optional auth: Invalid token provided');
    }
  }

  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireEmployer,
  requireJobseeker,
  optionalAuth
};
