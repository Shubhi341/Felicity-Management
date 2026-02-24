const PasswordReset = require('../models/PasswordReset');
const Participant = require('../models/Participant');
const bcrypt = require('bcrypt');

// 1. Organizer requests a password reset
const requestPasswordReset = async (req, res) => {
    try {
        const { email, reason } = req.body;

        // Find organizer by email
        const organizer = await Participant.findOne({ email, role: 'organizer' });
        if (!organizer) {
            return res.status(404).json({ message: 'No organizer found with that email' });
        }

        // Check if a pending request already exists
        const existing = await PasswordReset.findOne({ organizer: organizer._id, status: 'Pending' });
        if (existing) {
            return res.status(400).json({ message: 'A password reset request is already pending for this account.' });
        }

        const resetRequest = await PasswordReset.create({
            organizer: organizer._id,
            reason
        });

        res.status(201).json({ message: 'Password reset request submitted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 2. Admin views all requests
const getAllResetRequests = async (req, res) => {
    try {
        const requests = await PasswordReset.find()
            .populate('organizer', 'clubName email')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 3. Admin Approves or Rejects
const processResetRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminComment } = req.body; // status: 'Approved' or 'Rejected'

        const resetRequest = await PasswordReset.findById(id).populate('organizer');
        if (!resetRequest) return res.status(404).json({ message: 'Request not found' });
        if (resetRequest.status !== 'Pending') return res.status(400).json({ message: 'Request is already processed' });

        resetRequest.status = status;
        resetRequest.adminComment = adminComment || '';

        let newPasswordCleartext = null;

        if (status === 'Approved') {
            // Generate a secure temporary password
            newPasswordCleartext = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8); // 16 chars

            // Hash and update organizer's password
            const salt = await bcrypt.genSalt(10);
            resetRequest.organizer.password = await bcrypt.hash(newPasswordCleartext, salt);
            await resetRequest.organizer.save();
        }

        await resetRequest.save();

        res.json({
            message: `Request ${status.toLowerCase()} successfully`,
            request: resetRequest,
            newPassword: newPasswordCleartext // Sent back to Admin to share out-of-band
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    requestPasswordReset,
    getAllResetRequests,
    processResetRequest
};
