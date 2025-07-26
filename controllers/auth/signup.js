const User = require('../../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id, name, email, role) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  return jwt.sign({ userId: id, name, email, role }, JWT_SECRET, {
    expiresIn: '24h'
  });
};

const signup = async (req, res) => {
  try {
    const { name, email, password, role = 'jobseeker', phone, company, skills, jobTitle } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      company,
      skills,
      jobTitle
    });

    const token = generateToken(user._id, user.name, user.email, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
};

module.exports = signup;
