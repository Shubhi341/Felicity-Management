const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Participant = require('../models/Participant');

// =============================
// Create Event (Organizer Only)
// =============================
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      eventType,
      eligibility,
      registrationDeadline,
      startDate,
      endDate,
      registrationLimit,
      registrationFee,
      eventTags
    } = req.body;

    const event = await Event.create({
      title,
      description,
      eventType,
      eligibility,
      registrationDeadline,
      startDate,
      endDate,
      registrationLimit,
      registrationFee,
      eventTags,
      organizer: req.user.id
    });

    res.status(201).json({
      message: 'Event created successfully',
      event
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =======================================
// Organizer Views Participants of Event
// =======================================
const getEventParticipants = async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const registrations = await Registration.find({ event: eventId })
      .populate('participant', 'firstName lastName email collegeName');

    res.json({
      event: event.title,
      totalRegistrations: registrations.length,
      participants: registrations.map(r => r.participant)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =============================
// Get All Events (Public)
// =============================
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: { $ne: 'draft' } })
      .select('title description eventType startDate endDate status organizer')
      .populate('organizer', 'firstName lastName email');

    res.json(events);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =============================
// Get Single Event (Public)
// =============================
// Get Single Event (Public)
// =============================
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'firstName lastName email organizerName contactEmail');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Shield draft events from public (allow if no token and it's published, or if token exists check role)
    // Actually, getEventById is often public. If it's a draft, ONLY the organizer should see it.
    if (event.status === 'draft') {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(403).json({ message: 'This event is not yet published.' });
      }
      // Basic token check just for organizer matching (Requires verify logic if we want to be strict here)
      // Since getEventById might not always use the auth middleware, we should check req.user if present.
      if (req.user && event.organizer._id.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'This event is not yet published.' });
      }
    }

    // Count registrations (excluding rejected ones if necessary, or just all)
    // Assuming 'pending' and 'approved' count towards limit
    const registrationCount = await Registration.countDocuments({
      event: req.params.id,
      paymentStatus: { $ne: 'rejected' }
    });

    const eventObj = event.toObject();
    eventObj.registrationCount = registrationCount;

    res.json(eventObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =============================
// Publish Event (Organizer Only)
// =============================
const publishEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (event.status !== 'draft') {
      return res.status(400).json({
        message: 'Event is already published or closed'
      });
    }

    event.status = 'published';
    await event.save();

    // Trigger Discord Webhook
    try {
      const organizer = await Participant.findById(req.user.id);
      if (organizer && organizer.discordWebhook) {
        const message = {
          content: `🎉 **New Event Published!** 🎉\n**${event.title}**\n${event.description}\nCheck it out: http://localhost:5173/events/${event._id}`
        };
        const axios = require('axios'); // Load locally since it might not be at top level
        axios.post(organizer.discordWebhook, message)
          .then(res => console.log("Discord webhook successful. Status:", res.status))
          .catch(err => console.error("Discord Webhook Error", err.message));
      }
    } catch (e) {
      console.error("Failed to process webhook", e);
    }

    res.json({
      message: 'Event published successfully',
      event
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =============================
// Get Trending Events (Top 5 in last 24h)
// =============================
const getTrendingEvents = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Aggregate registrations created in last 24h
    const trendingStats = await Registration.aggregate([
      { $match: { createdAt: { $gte: oneDayAgo } } },
      { $group: { _id: '$event', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Populate event details, ensuring they are not drafts
    const eventIds = trendingStats.map(stat => stat._id);
    const events = await Event.find({ _id: { $in: eventIds }, status: { $ne: 'draft' } })
      .populate('organizer', 'firstName lastName organizerName');

    // Attach count to event object (optional, or just return sorted events)
    // To maintain order, we should map back
    const sortedEvents = eventIds.map(id => events.find(e => e._id.toString() === id.toString())).filter(e => e !== undefined);

    res.json(sortedEvents);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createEvent,
  getEventParticipants,
  getAllEvents,
  publishEvent,
  getEventById,
  getTrendingEvents
};
