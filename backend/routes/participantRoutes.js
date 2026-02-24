const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    changePassword,
    getAllOrganizers,
    getOrganizerById,
    toggleFollowOrganizer,
    createOrganizer,
    deleteOrganizer
} = require('../controllers/participantController');
const protect = require('../middleware/authMiddleware');
const restrictTo = require('../middleware/roleMiddleware'); // Ensure this exists or import correctly

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Organizers interaction
router.get('/organizers', getAllOrganizers); // Public list of organizers
router.get('/organizers/:id', getOrganizerById); // Public single organizer details
router.post('/organizers/:id/follow', protect, restrictTo('participant'), toggleFollowOrganizer);

// Admin Routes
router.post('/admin/organizers', protect, restrictTo('admin'), createOrganizer);
router.delete('/admin/organizers/:id', protect, restrictTo('admin'), deleteOrganizer);

module.exports = router;
