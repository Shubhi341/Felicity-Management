const express = require('express');
const {
  registerParticipant,
  loginParticipant
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerParticipant);
router.post('/login', loginParticipant);

module.exports = router;
