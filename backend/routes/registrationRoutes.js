const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  getMyRegistrations,
  updatePaymentStatus,
  markAttendance
} = require('../controllers/registrationController');
const protect = require('../middleware/authMiddleware');
const allowRoles = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// =============================
// Get My Registrations
// =============================
router.get('/my', protect, getMyRegistrations);

// =============================
// Update Payment Status (Organizer/Admin)
// =============================
router.patch(
  '/:id/payment-status',
  protect,
  allowRoles('organizer', 'admin'),
  updatePaymentStatus
);

// =============================
// Mark Attendance (Organizer Only)
// =============================
router.post(
  '/mark-attendance',
  protect,
  allowRoles('organizer', 'admin'),
  markAttendance
);

// =============================
// Participant registers for event
// =============================
router.post(
  '/events/:id/register',
  protect,
  allowRoles('participant'),
  upload.single('paymentProof'), // Expect 'paymentProof' field
  registerForEvent
);

module.exports = router;
