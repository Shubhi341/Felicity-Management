const express = require('express');
const protect = require('../middleware/authMiddleware');
const allowRoles = require('../middleware/roleMiddleware');

const {
  createEvent,
  getEventParticipants,
  getAllEvents,
  publishEvent,
  getEventById,
  getTrendingEvents
} = require('../controllers/eventController');

const router = express.Router();

// Public - Browse events
router.get('/trending', getTrendingEvents);
router.get('/', getAllEvents);
router.get('/:id', getEventById);

// Organizer creates event
router.post(
  '/',
  protect,
  allowRoles('organizer'),
  createEvent
);

// Organizer publishes event
router.patch(
  '/:id/publish',
  protect,
  allowRoles('organizer'),
  publishEvent
);

// Organizer views participants
router.get(
  '/:id/participants',
  protect,
  allowRoles('organizer'),
  getEventParticipants
);

module.exports = router;
