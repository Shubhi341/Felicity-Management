const Participant = require('../models/Participant');
const bcrypt = require('bcrypt');

// ===============================
// Admin creates an Organizer
// ===============================
const createOrganizer = async (req, res) => {
  try {
    const { firstName, lastName, email, password, organizerName, category, description, contactEmail } = req.body;

    const existing = await Participant.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const organizer = await Participant.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'organizer',
      organizerName,
      category,
      description,
      contactEmail
    });

    res.status(201).json({
      message: 'Organizer created successfully',
      organizerId: organizer._id
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===============================
// Admin removes an Organizer
// ===============================
const removeOrganizer = async (req, res) => {
  try {
    const organizerId = req.params.id;

    const organizer = await Participant.findOne({
      _id: organizerId,
      role: 'organizer'
    });

    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    await organizer.deleteOne();

    res.json({ message: 'Organizer removed successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createOrganizer,
  removeOrganizer
};
