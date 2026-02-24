const express = require('express');
const router = express.Router();
const { requestReset, getPendingRequests, resolveRequest } = require('../controllers/passwordResetController');
const protect = require('../middleware/authMiddleware');
const allowRoles = require('../middleware/roleMiddleware');

// Public route to request reset
router.post('/request', requestReset);

// Admin routes
router.get('/pending', protect, allowRoles('admin'), getPendingRequests);
router.patch('/:id/resolve', protect, allowRoles('admin'), resolveRequest);

module.exports = router;
