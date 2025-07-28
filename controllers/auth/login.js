const User = require('../../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id, name, email, role) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  return jwt.sign({ userId: id, name, email, role }, JWT_SECRET, {
    expiresIn: '24h'
  });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (user) {
      const userObj = user.toObject();
      delete userObj.password;
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is disabled. Please contact support.'
      });
    }

    // Check if employer is authorized
    if (user.role === 'employer' && !user.isAuthorized) {
      return res.status(401).json({
        success: false,
        message: 'Your account is not authorized yet. Please contact admin using contact form.'
      });
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id, user.name, user.email, user.role);

    // Find user by email and return all fields except password
    const userToReturn = await User.findOne({ email: email.toLowerCase() });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userToReturn,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};

module.exports = login;
