const Participant = require('../models/Participant');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

// Get Pending Payments
const getPendingPayments = async (req, res) => {
    try {
        const organizerId = req.user.id;
        const events = await Event.find({ organizer: organizerId }).select('_id');
        const eventIds = events.map(e => e._id);

        const registrations = await Registration.find({
            event: { $in: eventIds },
            paymentStatus: 'pending'
        })
            .populate('event', 'title')
            .populate('participant', 'firstName lastName email');

        res.json(registrations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get All Registrations (Grouped by Event) - NEW
const getAllRegistrations = async (req, res) => {
    try {
        const organizerId = req.user.id;
        const events = await Event.find({ organizer: organizerId }).select('_id title');

        const result = [];

        for (const event of events) {
            const regs = await Registration.find({ event: event._id })
                .populate('participant', 'firstName lastName email paymentProof');

            result.push({
                event: event,
                registrations: regs
            });
        }

        res.json(result);
    } catch (error) {
        console.error("Error fetching all registrations:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Organizer Stats (Analytics)
const getOrganizerStats = async (req, res) => {
    try {
        const organizerId = req.user.id;
        // Count events
        const totalEvents = await Event.countDocuments({ organizer: organizerId });

        // Get all events to calculate revenue
        const events = await Event.find({ organizer: organizerId }).select('_id registrationFee');
        const eventIds = events.map(e => e._id);

        // Calculate total registrations
        const totalRegistrations = await Registration.countDocuments({ event: { $in: eventIds } });

        // Calculate Total Revenue (Only for approved/successful payments)
        // Revenue = Sum of (Registration Fee * Quantity)
        const revenueAgg = await Registration.aggregate([
            {
                $match: {
                    event: { $in: eventIds },
                    paymentStatus: { $in: ['approved', 'successful'] }
                }
            },
            {
                $lookup: {
                    from: 'events',
                    localField: 'event',
                    foreignField: '_id',
                    as: 'eventDetails'
                }
            },
            { $unwind: '$eventDetails' },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: { $multiply: ['$quantity', '$eventDetails.registrationFee'] } }
                }
            }
        ]);
        const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

        // Calculate Total Attendance
        const totalAttendance = await Registration.countDocuments({
            event: { $in: eventIds },
            attended: true
        });

        res.json({
            totalEvents,
            totalRegistrations,
            totalRevenue,
            totalAttendance
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Organizer Events
const getOrganizerEvents = async (req, res) => {
    try {
        console.log(`Fetching events for organizer: ${req.user.id}`);
        const events = await Event.find({ organizer: req.user.id }).sort({ createdAt: -1 });
        console.log(`Found ${events.length} events`);
        res.json(events);
    } catch (error) {
        console.error("Error fetching organizer events:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create Event
const createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            location, // Added location
            eventType,
            eligibility,
            registrationDeadline,
            startDate,
            endDate,
            registrationLimit,
            registrationFee,
            eventTags,
            merchandiseVariants,
            purchaseLimit,
            formSchema
        } = req.body;

        const newEvent = await Event.create({
            title,
            description,
            location, // Added location
            eventType,
            eligibility,
            registrationDeadline,
            startDate,
            endDate,
            registrationLimit,
            registrationFee,
            eventTags,
            merchandiseVariants,
            purchaseLimit,
            formSchema,
            organizer: req.user.id,
            status: 'draft' // Default to draft
        });

        res.status(201).json(newEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update Event
const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Strict Editing Rules
        const status = event.status;
        const updates = req.body;
        const allowedUpdates = [];

        // Check if event has registrations to lock Form Schema
        const registrationCount = await Registration.countDocuments({ event: event._id });
        const hasRegistrations = registrationCount > 0;

        if (hasRegistrations && updates.formSchema && JSON.stringify(updates.formSchema) !== JSON.stringify(event.formSchema)) {
            return res.status(403).json({ message: 'Cannot edit the Registration Form after the first registration is received.' });
        }

        if (status === 'draft') {
            // Check if it's being published right now
            if (updates.status === 'published') {
                try {
                    const organizer = await Participant.findById(req.user.id);
                    if (organizer && organizer.discordWebhook) {
                        const title = updates.title || event.title;
                        const desc = updates.description || event.description;
                        const message = {
                            content: `🎉 **New Event Published!** 🎉\n**${title}**\n${desc}\nCheck it out: http://localhost:5173/events/${event._id}`
                        };
                        // Fire and forget webhook
                        fetch(organizer.discordWebhook, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(message)
                        }).catch(err => console.error("Discord Webhook Error", err));
                    }
                } catch (e) {
                    console.error("Failed to process webhook", e);
                }
            }

            // Draft: Allow everything
            Object.assign(event, updates);
        } else if (status === 'published') {
            // Published: Allow Description, Deadline, Limit, Location, Tags, Form Schema (maybe)
            // DISALLOW: Title, Fees, Dates (Start/End), EventType
            const allowedFields = ['description', 'registrationDeadline', 'registrationLimit', 'location', 'eventTags', 'merchandiseVariants', 'purchaseLimit', 'formSchema'];

            // Check for forbidden fields
            const forbiddenFields = ['title', 'registrationFee', 'startDate', 'endDate', 'eventType'];

            const attemptedForbidden = Object.keys(updates).filter(key => {
                if (!forbiddenFields.includes(key)) return false;

                // Compare values
                let oldVal = event[key];
                let newVal = updates[key];

                // Handle Dates
                if (key === 'startDate' || key === 'endDate') {
                    if (!newVal) return false; // No update sent
                    const d1 = new Date(oldVal).getTime();
                    const d2 = new Date(newVal).getTime();
                    // Ignore invalid dates
                    if (isNaN(d1) || isNaN(d2)) return false;
                    return Math.abs(d1 - d2) > 60000; // Allow 1 minute difference for format quirks
                }

                // Handle Numbers (Fees)
                if (key === 'registrationFee') {
                    return Number(oldVal) !== Number(newVal);
                }

                return String(oldVal) !== String(newVal);
            });

            if (attemptedForbidden.length > 0) {
                return res.status(403).json({ message: `Cannot edit ${attemptedForbidden.join(', ')} for a published event.` });
            }

            // Apply allowed updates
            allowedFields.forEach(field => {
                if (updates[field] !== undefined) event[field] = updates[field];
            });

        } else if (status === 'ongoing' || status === 'closed') {
            // Ongoing/Closed: Read-only except status (handled via specific routes usually, but if sent here...)
            // actually we only allow closing via separate route usually. 
            // Let's allow ONLY extending deadline or closing if specifically requested, but for now strict read-only.
            return res.status(403).json({ message: 'Ongoing or Closed events cannot be edited.' });
        }

        const updatedEvent = await event.save();
        res.json(updatedEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Event Participants
const getEventParticipants = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        if (event.organizer.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const registrations = await Registration.find({ event: req.params.id })
            .populate('participant', 'firstName lastName email contactNumber collegeName');

        res.json(registrations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getPendingPayments,
    getOrganizerStats,
    getOrganizerEvents,
    createEvent,
    updateEvent,
    getEventParticipants,
    getAllRegistrations
};
