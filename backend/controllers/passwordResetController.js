const PasswordReset = require('../models/PasswordReset');
const Participant = require('../models/Participant');
const bcrypt = require('bcryptjs');

// Request Password Reset (Organizer)
const requestReset = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        const organizer = await Participant.findOne({ email, role: 'organizer' });
        if (!organizer) {
            return res.status(404).json({ message: 'Organizer email not found' });
        }

        // Check if pending request exists
        const existingRequest = await PasswordReset.findOne({ organizer: organizer._id, status: 'pending' });
        if (existingRequest) {
            return res.status(400).json({ message: 'A reset request is already pending' });
        }

        // Hash the new requested password mostly for security so we don't store plain text even temporarily if possible
        // But for simplicity in this flow, we might store it and then move it to user on approval.
        // Let's hash it now.
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await PasswordReset.create({
            email,
            organizer: organizer._id,
            newPassword: hashedPassword
        });

        res.status(201).json({ message: 'Password reset request sent to Admin' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get All Pending Requests (Admin)
const getPendingRequests = async (req, res) => {
    try {
        const requests = await PasswordReset.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Approve/Reject Request (Admin)
const resolveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'approved' or 'rejected'

        const resetRequest = await PasswordReset.findById(id);
        if (!resetRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (resetRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Request already resolved' });
        }

        resetRequest.status = status;
        await resetRequest.save();

        if (status === 'approved') {
            // Update Organizer Password
            const organizer = await Participant.findById(resetRequest.organizer);
            if (organizer) {
                organizer.password = resetRequest.newPassword;
                await organizer.save();
            }
        }

        res.json({ message: `Request ${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    requestReset,
    getPendingRequests,
    resolveRequest
};
