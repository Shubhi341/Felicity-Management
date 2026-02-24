const express = require('express');
const router = express.Router();
const { submitFeedback, getEventFeedback } = require('../controllers/feedbackController');
const protect = require('../middleware/authMiddleware');

// Get feedback for an event
router.get('/:eventId', getEventFeedback);

// Submit feedback (Authenticated participants)
router.post('/', protect, submitFeedback);

module.exports = router;
