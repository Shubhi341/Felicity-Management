const Participant = require('../models/Participant');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// =============================
// PARTICIPANT REGISTRATION
// =============================
const registerParticipant = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      participantType,
      collegeName,
      contactNumber
    } = req.body;

    // =============================
    // IIIT Email Domain Validation
    // =============================
    if (participantType === 'IIIT') {
      if (!email.endsWith('@iiit.ac.in')) {
        return res.status(400).json({
          message: 'IIIT participants must use IIIT-issued email ID'
        });
      }
    }

    // Check if user already exists
    const existing = await Participant.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Force role = participant (IMPORTANT)
    const participant = await Participant.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'participant',          // 🔒 enforced
      participantType,
      collegeName,
      contactNumber
    });

    res.status(201).json({
      message: 'Participant registered successfully',
      participantId: participant._id
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =============================
// LOGIN (ALL ROLES)
// =============================
const loginParticipant = async (req, res) => {
  try {
    const { email, password } = req.body;

    const participant = await Participant.findOne({ email });
    if (!participant) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, participant.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        id: participant._id,
        role: participant.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      participant: {
        id: participant._id,
        email: participant.email,
        role: participant.role
      }
    });

  } catch (error) {
    console.error("Login endpoint failed:", error);
    res.status(500).json({ message: `Server error: ${error.message || String(error)}` });
  }
};

module.exports = {
  registerParticipant,
  loginParticipant
};
