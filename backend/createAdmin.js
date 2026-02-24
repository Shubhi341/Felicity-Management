require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Participant = require('./models/Participant');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const createAdmin = async () => {
  try {
    const existing = await Participant.findOne({ role: 'admin' });
    if (existing) {
      console.log('Admin already exists');
      process.exit();
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await Participant.create({
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@felicity.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Admin created successfully');
    process.exit();

  } catch (error) {
    console.error(error);
    process.exit();
  }
};

createAdmin();
