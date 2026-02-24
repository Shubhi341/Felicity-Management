require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Participant = require('./models/Participant');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

const createParticipant = async () => {
    try {
        const email = 'user2@iiit.ac.in';
        const existing = await Participant.findOne({ email });

        if (existing) {
            console.log(`User ${email} already exists.`);
            process.exit();
        }

        const hashedPassword = await bcrypt.hash('password123', 10);

        await Participant.create({
            firstName: 'User',
            lastName: 'Two',
            email: email,
            password: hashedPassword,
            role: 'participant',
            participantType: 'IIIT',
            collegeName: 'IIIT Hyderabad',
            contactNumber: '9999999999'
        });

        console.log(`User created: ${email} / password123`);
        process.exit();

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

createParticipant();
