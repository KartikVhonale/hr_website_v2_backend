const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth-middleware');
const UserController = require('../controllers/user-controller');
const router = express.Router();

// Saved candidates endpoints (for employers)
router.get('/saved-candidates', verifyToken, UserController.getSavedCandidates);
router.post('/save-candidate/:candidateId', verifyToken, UserController.saveCandidate);
router.delete('/save-candidate/:candidateId', verifyToken, UserController.removeSavedCandidate);
router.put('/update-candidate-status/:candidateId', verifyToken, UserController.updateCandidateStatus);
router.put('/update-candidate-notes/:candidateId', verifyToken, UserController.updateCandidateNotes);

// Saved jobs endpoints (for jobseekers)
router.get('/saved-jobs', verifyToken, UserController.getSavedJobs);
router.post('/save-job/:jobId', verifyToken, UserController.saveJob);
router.delete('/save-job/:jobId', verifyToken, UserController.unsaveJob);

// Profile endpoints
router.put('/profile', verifyToken, UserController.updateProfile);

// Resume endpoints
router.post('/resume', verifyToken, UserController.saveResume);
router.get('/resume', verifyToken, UserController.getResume);

// Notification endpoints
router.get('/notifications', verifyToken, UserController.getNotifications);
router.put('/notifications/:id/read', verifyToken, UserController.markNotificationAsRead);
router.delete('/notifications/:id', verifyToken, UserController.deleteNotification);

// Search and stats endpoints (Admin only)
router.get('/search', verifyToken, requireAdmin, UserController.searchUsers);
router.get('/stats', verifyToken, requireAdmin, UserController.getUserStats);
router.put('/bulk-update', verifyToken, requireAdmin, UserController.bulkUpdateUsers);

module.exports = router;
