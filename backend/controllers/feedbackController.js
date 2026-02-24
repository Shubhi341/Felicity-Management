const Feedback = require('../models/Feedback');
const Event = require('../models/Event');

// Submit Feedback
const submitFeedback = async (req, res) => {
    try {
        const { eventId, rating, comment, isAnonymous } = req.body;
        const userId = req.user.id;

        // Check if event exists
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Check if already submitted
        const existing = await Feedback.findOne({ event: eventId, user: userId });
        if (existing) {
            return res.status(400).json({ message: 'You have already submitted feedback for this event' });
        }

        const feedback = await Feedback.create({
            event: eventId,
            user: userId,
            rating,
            comment,
            isAnonymous
        });

        res.status(201).json({ message: 'Feedback submitted successfully', feedback });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Feedback for an Event (Public/Organizer)
const getEventFeedback = async (req, res) => {
    try {
        const { eventId } = req.params;
        const feedbacks = await Feedback.find({ event: eventId })
            .populate('user', 'firstName lastName')
            .sort({ createdAt: -1 });

        // Mask user details if anonymous
        const sanitizedFeedbacks = feedbacks.map(f => {
            if (f.isAnonymous) {
                // Return a plain object with masked user
                return {
                    ...f.toObject(),
                    user: { firstName: 'Anonymous', lastName: '' }
                };
            }
            return f;
        });

        res.json(sanitizedFeedbacks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    submitFeedback,
    getEventFeedback
};
