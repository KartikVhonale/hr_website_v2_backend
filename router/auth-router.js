const express = require('express');
const {
  signup,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  resetPassword,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  updateUser,
  authorizeEmployer
} = require('../controllers/auth');
const { verifyToken, requireAdmin } = require('../middleware/auth-middleware');
const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes (require authentication)
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);

// Admin routes (require admin privileges)
router.get('/users', verifyToken, requireAdmin, getAllUsers);
router.put('/users/:userId/status', verifyToken, requireAdmin, updateUserStatus);
router.delete('/users/:userId', verifyToken, requireAdmin, deleteUser);
router.put('/users/:userId/reset-password', verifyToken, requireAdmin, resetPassword);
router.put('/users/:userId', verifyToken, requireAdmin, updateUser);
router.put('/users/:userId/authorize', verifyToken, requireAdmin, authorizeEmployer);

module.exports = router;
