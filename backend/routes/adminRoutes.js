const express = require('express');
const protect = require('../middleware/authMiddleware');
const allowRoles = require('../middleware/roleMiddleware');

const {
  createOrganizer,
  removeOrganizer
} = require('../controllers/adminController');

const router = express.Router();

router.post(
  '/organizers',
  protect,
  allowRoles('admin'),
  createOrganizer
);

router.delete(
  '/organizers/:id',
  protect,
  allowRoles('admin'),
  removeOrganizer
);

module.exports = router;
