
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// middleware
app.use(express.json());

// connect DB
connectDB();

// Serve Uploads
app.use('/uploads', express.static('uploads'));

const registrationRoutes = require('./routes/registrationRoutes');
app.use('/api/registrations', registrationRoutes);


// routes
app.use('/api/auth', authRoutes);
app.use('/api', protectedRoutes);
app.use('/api/events', eventRoutes);

// test route
app.get('/', (req, res) => {
  res.send('Backend is running');
});

const participantRoutes = require('./routes/participantRoutes');
app.use('/api/participants', participantRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

const organizerRoutes = require('./routes/organizerRoutes');
app.use('/api/organizer', organizerRoutes);

const discussionRoutes = require('./routes/discussionRoutes');
app.use('/api/discussions', discussionRoutes);

const passwordResetRoutes = require('./routes/passwordResetRoutes');
app.use('/api/password-reset', passwordResetRoutes);

const feedbackRoutes = require('./routes/feedbackRoutes');
app.use('/api/feedback', feedbackRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
