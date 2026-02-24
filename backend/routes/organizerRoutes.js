const express = require('express');
const router = express.Router();
const {
    getOrganizerEvents,
    getOrganizerStats,
    createEvent,
    updateEvent,
    getEventParticipants,
    getPendingPayments,
    getAllRegistrations
} = require('../controllers/organizerController');
const protect = require('../middleware/authMiddleware');
const allowRoles = require('../middleware/roleMiddleware');

// All routes are protected and for organizers only
router.use(protect);
router.use(allowRoles('organizer'));

router.get('/dashboard/stats', getOrganizerStats);
router.get('/registrations', getAllRegistrations);
router.get('/registrations/pending', getPendingPayments);
router.get('/events', getOrganizerEvents);
router.post('/events', createEvent);
router.put('/events/:id', updateEvent);
router.get('/events/:id/participants', getEventParticipants);

module.exports = router;
