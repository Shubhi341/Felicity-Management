require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Using bcryptjs as installed earlier
const Participant = require('./models/Participant');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

const resetAdmin = async () => {
    try {
        const hashedPassword = await bcrypt.hash('admin', 10);

        // Try to find existing admin
        let admin = await Participant.findOne({ role: 'admin' });

        if (admin) {
            console.log(`Found existing admin: ${admin.email}. Updating...`);
            admin.email = 'admin@iiit.ac.in';
            admin.password = hashedPassword;
            await admin.save();
            console.log('Admin credentials updated to: admin@iiit.ac.in / admin');
        } else {
            console.log('No admin found. Creating new one...');
            await Participant.create({
                firstName: 'System',
                lastName: 'Admin',
                email: 'admin@iiit.ac.in',
                password: hashedPassword,
                role: 'admin'
            });
            console.log('Admin created: admin@iiit.ac.in / admin');
        }
        process.exit();

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

resetAdmin();
