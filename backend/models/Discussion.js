const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema(
    {
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Participant',
            required: true
        },
        message: {
            type: String,
            required: true
        },
        isPinned: {
            type: Boolean,
            default: false
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Discussion',
            default: null // For threading
        },
        reactions: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant' },
            type: { type: String, enum: ['like', 'love', 'laugh', 'sad'] }
        }]
    },
    { timestamps: true }
);

module.exports = mongoose.model('Discussion', discussionSchema);
