const express = require('express');
const router = express.Router();
const {
    getAllJobs,
    getJobById,
    updateJob,
    deleteJob,
    createJob,
} = require('../controllers/admin-controller');
const { verifyToken, requireAdmin } = require('../middleware/auth-middleware');

// Job routes
router.get('/jobs', verifyToken, requireAdmin, getAllJobs);
router.post('/jobs', verifyToken, requireAdmin, createJob);
router.get('/jobs/:id', verifyToken, requireAdmin, getJobById);
router.put('/jobs/:id', verifyToken, requireAdmin, updateJob);
router.delete('/jobs/:id', verifyToken, requireAdmin, deleteJob);

module.exports = router;
