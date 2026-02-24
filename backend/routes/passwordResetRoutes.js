const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const allowRoles = require('../middleware/roleMiddleware');
const {
    requestPasswordReset,
    getAllResetRequests,
    processResetRequest
} = require('../controllers/passwordResetController');

// Organizer requests reset (no auth required since they forgot password, but we need an identifier)
router.post('/request', requestPasswordReset);

// Admin routes
router.get('/', protect, allowRoles('admin'), getAllResetRequests);
router.patch('/:id', protect, allowRoles('admin'), processResetRequest);

module.exports = router;
