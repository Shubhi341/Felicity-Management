const Discussion = require('../models/Discussion');
const Event = require('../models/Event');

// Get Messages for an Event
const getEventMessages = async (req, res) => {
    try {
        const { eventId } = req.params;
        const messages = await Discussion.find({ event: eventId, isDeleted: false })
            .populate('user', 'firstName lastName role')
            .populate({
                path: 'replyTo',
                select: 'message user',
                populate: { path: 'user', select: 'firstName lastName' }
            })
            .sort({ createdAt: 1 }); // Oldest first
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Post a Message
const postMessage = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { message, replyTo } = req.body;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const newMessage = await Discussion.create({
            event: eventId,
            user: req.user.id,
            message,
            replyTo: replyTo || null
        });

        await newMessage.populate('user', 'firstName lastName role');
        if (replyTo) {
            await newMessage.populate({
                path: 'replyTo',
                select: 'message user',
                populate: { path: 'user', select: 'firstName lastName' }
            });
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Pin/Unpin a Message (Organizer/Admin only)
const pinMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const message = await Discussion.findById(messageId).populate('event');

        if (!message) return res.status(404).json({ message: 'Message not found' });

        if (message.event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized to pin messages' });
        }

        message.isPinned = !message.isPinned;
        await message.save();
        res.json({ message: 'Message pin status updated', isPinned: message.isPinned });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a Message (Owner or Organizer/Admin)
const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const message = await Discussion.findById(messageId).populate('event');

        if (!message) return res.status(404).json({ message: 'Message not found' });

        // Can be deleted by the author, the event organizer, or an admin
        const isAuthor = message.user.toString() === req.user.id;
        const isOrganizer = message.event.organizer.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isAuthor && !isOrganizer && !isAdmin) {
            return res.status(403).json({ message: 'Unauthorized to delete this message' });
        }

        message.isDeleted = true; // Soft delete
        await message.save();
        res.json({ message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// React to a Message
const reactToMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { type } = req.body; // 'like', 'love', 'laugh', 'sad'

        if (!['like', 'love', 'laugh', 'sad'].includes(type)) {
            return res.status(400).json({ message: 'Invalid reaction type' });
        }

        const message = await Discussion.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        // Check if user already reacted
        const existingReactionIndex = message.reactions.findIndex(r => r.user.toString() === req.user.id);

        if (existingReactionIndex >= 0) {
            if (message.reactions[existingReactionIndex].type === type) {
                // Toggle off if clicking same reaction
                message.reactions.splice(existingReactionIndex, 1);
            } else {
                // Change reaction
                message.reactions[existingReactionIndex].type = type;
            }
        } else {
            // Add new reaction
            message.reactions.push({ user: req.user.id, type });
        }

        await message.save();
        res.json({ reactions: message.reactions });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getEventMessages,
    postMessage,
    pinMessage,
    deleteMessage,
    reactToMessage
};
