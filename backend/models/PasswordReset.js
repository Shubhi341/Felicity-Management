const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true
        },
        organizer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Participant' // Organizers are in Participant collection with role='organizer'
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'completed'],
            default: 'pending'
        },
        newPassword: {
            type: String, // Temporarily store requested new password or generated one (hashed)
            required: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
