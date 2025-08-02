const express = require('express');
const router = express.Router();
const {
    getEmployerProfile,
    updateEmployerProfile,
    getPostedJobs,
    getApplicationsForJob,
    updateApplicationStatus,
    getSavedCandidates,
    saveCandidate,
    unsaveCandidate,
    getDashboardData,
    getEmployerStats,
    searchCandidates
} = require('../controllers/employer-controller');
const { verifyToken, requireEmployer } = require('../middleware/auth-middleware');

// Profile routes
router.get('/profile', verifyToken, requireEmployer, getEmployerProfile);
router.put('/profile', verifyToken, requireEmployer, updateEmployerProfile);

// Job routes
router.get('/jobs', verifyToken, requireEmployer, getPostedJobs);

// Application routes
router.get('/jobs/:jobId/applications', verifyToken, requireEmployer, getApplicationsForJob);
router.put('/applications/:applicationId', verifyToken, requireEmployer, updateApplicationStatus);

// Saved candidates routes
router.get('/saved-candidates', verifyToken, requireEmployer, getSavedCandidates);
router.post('/saved-candidates/:candidateId', verifyToken, requireEmployer, saveCandidate);
router.delete('/saved-candidates/:candidateId', verifyToken, requireEmployer, unsaveCandidate);

// Dashboard and stats routes
router.get('/dashboard', verifyToken, requireEmployer, getDashboardData);
router.get('/stats', verifyToken, requireEmployer, getEmployerStats);

// Candidate search route
router.get('/candidates', verifyToken, requireEmployer, searchCandidates);

module.exports = router;
