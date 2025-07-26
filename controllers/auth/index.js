const signup = require('./signup');
const login = require('./login');
const logout = require('./logout');
const { getProfile, updateProfile } = require('./profile');
const { changePassword, resetPassword } = require('./password');
const { getAllUsers, updateUserStatus, deleteUser, updateUser } = require('./admin');

module.exports = {
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
  updateUser
};
