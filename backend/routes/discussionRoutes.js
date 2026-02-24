const express = require('express');
const router = express.Router();
const { getEventMessages, postMessage } = require('../controllers/discussionController');
const protect = require('../middleware/authMiddleware');

router.get('/:eventId', getEventMessages);
router.post('/:eventId', protect, postMessage);

// New Routes for Moderation & Features
router.patch('/:messageId/pin', protect, require('../controllers/discussionController').pinMessage);
router.delete('/:messageId', protect, require('../controllers/discussionController').deleteMessage);
router.post('/:messageId/react', protect, require('../controllers/discussionController').reactToMessage);

module.exports = router;
