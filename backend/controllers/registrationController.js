const { sendEmail } = require('../services/emailService');
const QRCode = require('qrcode');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Participant = require('../models/Participant'); // Import Participant model

// ... (inside registerForEvent)

// 5. Update Stock/Limit (Simplification: not handling concurrency perfectly here)
// If merchandise, verify stock (TODO: Add sophisticated stock check)

// 6. Send Email

const registerForEvent = async (req, res) => {
  try {
    const { eventId, merchandiseVariant, quantity } = req.body;
    let answers = req.body.answers;

    // answers comes as a JSON string because we use FormData
    if (answers && typeof answers === 'string') {
      try {
        answers = JSON.parse(answers);
      } catch (e) {
        console.error("Failed to parse answers", e);
      }
    }

    const participantId = req.user.id;

    // Fetch Participant to get email
    const participant = await Participant.findById(participantId);
    if (!participant) return res.status(404).json({ message: 'Participant not found' });

    // Check for file upload
    const paymentProofUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // 1. Check if event exists
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check Deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Check Limit (if not standard unlimited/0)
    if (event.registrationLimit > 0) {
      const count = await Registration.countDocuments({ event: eventId });
      if (count >= event.registrationLimit) {
        return res.status(400).json({ message: 'Registration limit reached' });
      }
    }

    // Check Eligibility
    if (event.eligibility === 'IIIT Only') {
      // Assuming IIIT emails end with iiit.ac.in
      if (!participant.email.endsWith('iiit.ac.in')) {
        return res.status(403).json({ message: 'This event is restricted to IIIT students only.' });
      }
    }

    // 2. Check if already registered (for Normal events)
    if (event.eventType === 'normal') {
      const existing = await Registration.findOne({ participant: participantId, event: eventId });
      if (existing) return res.status(400).json({ message: 'Already registered' });
    }

    // 3. Ticket ID Generation (Simple UUID or Random String)
    const ticketId = `TICKET-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 4. Create Registration
    const registration = await Registration.create({
      participant: participantId,
      event: eventId,
      ticketId,
      answers, // specific to normal events
      merchandiseVariant, // specific to merchandise
      quantity, // specific to merchandise
      paymentProofUrl,
      paymentStatus: paymentProofUrl ? 'pending' : 'successful' // If normal/free, successful immediately. If merchandise+proof, pending.
    });

    // 5. Update Stock/Limit (Simplification: not handling concurrency perfectly here)
    // If merchandise, verify stock (TODO: Add sophisticated stock check)

    // 6. Send Email with QR Code (OR Pending Notice)
    try {
      if (registration.paymentStatus === 'pending') {
        const emailText = `
            Hello,
            We have received your registration and payment proof for ${event.title}.
            
            Your registration is currently PENDING approval by the organizer.
            Once approved, you will receive another email with your Ticket and QR Code.
        `;
        await sendEmail(participant.email, `Payment Verification Pending: ${event.title}`, emailText);
      } else {
        const qrCodeDataUrl = await QRCode.toDataURL(ticketId);

        const emailText = `
            Hello,
            You have successfully registered for ${event.title}.
            
            Event: ${event.title}
            Date: ${new Date(event.startDate).toLocaleString()}
            Ticket ID: ${ticketId}
            
            Please show the attached QR Code at the venue for entry.
        `;

        await sendEmail(
          participant.email,
          `Registration Confirmation: ${event.title}`,
          emailText,
          [
            {
              filename: 'ticket-qr.png',
              content: qrCodeDataUrl.split("base64,")[1],
              encoding: 'base64'
            }
          ]
        );
      }
    } catch (emailErr) {
      console.error("Failed to send email:", emailErr);
      // Do not fail registration just because email failed
    }

    res.status(201).json({ message: 'Registration successful', ticketId });
  } catch (error) {
    console.error("Registration endpoint failed:", error);
    res.status(500).json({ message: `Server error: ${error.message || String(error)}` });
  }
};

// =============================
// Update Payment Status (Admin/Organizer)
// =============================
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params; // Registration ID
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const registration = await Registration.findById(id).populate('event');
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    registration.paymentStatus = status === 'approved' ? 'successful' : 'rejected';
    await registration.save();

    // If approved, send confirmation email + QR CODE, and decrement stock
    if (status === 'approved') {
      // Find the merchandise variant and decrement stock
      if (registration.event.eventType === 'merchandise') {
        const variant = registration.event.merchandiseVariants.find(v => v.variantName === registration.merchandiseVariant);
        if (variant && variant.stock >= registration.quantity) {
          variant.stock -= registration.quantity;
          registration.event.markModified('merchandiseVariants');
          await registration.event.save();
        }
      }

      await registration.populate('participant', 'email');
      const ticketId = registration.ticketId;
      const qrCodeDataUrl = await QRCode.toDataURL(ticketId);

      const emailText = `
            Hello,
            Your payment for ${registration.event.title} has been APPROVED!
            
            Event: ${registration.event.title}
            Ticket ID: ${ticketId}

            Please show the attached QR Code at the venue for entry/pickup.
        `;
      await sendEmail(registration.participant.email, `Payment Approved: ${registration.event.title}`, emailText, [
        {
          filename: 'ticket-qr.png',
          content: qrCodeDataUrl.split("base64,")[1],
          encoding: 'base64'
        }
      ]);
    } else {
      await registration.populate('participant', 'email');
      sendEmail(registration.participant.email, `Payment Rejected: ${registration.event.title}`, "Your payment proof was rejected. Please contact the organizer.");
    }

    res.json({ message: `Payment ${status}`, registration });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get My Registrations
const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ participant: req.user.id })
      .populate({
        path: 'event',
        select: 'title startDate endDate eventType location status',
        populate: {
          path: 'organizer',
          select: 'firstName lastName organizerName email'
        }
      })
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark Attendance (Organizer/Admin)
const markAttendance = async (req, res) => {
  try {
    const { ticketId, method = 'QR Scan', reason = '' } = req.body;

    const registration = await Registration.findOne({ ticketId }).populate('event');
    if (!registration) {
      return res.status(404).json({ message: 'Invalid Ticket ID' });
    }

    // Check if user is organizer of this event
    if (registration.event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized for this event' });
    }

    if (registration.attended) {
      return res.status(400).json({ message: 'Participant already marked attended' });
    }

    registration.attended = true;
    registration.attendanceTimestamp = new Date();
    registration.attendanceMethod = method;

    if (method === 'Manual Override') {
      registration.attendanceLog = {
        actionBy: req.user.id,
        reason: reason || 'Verified manually by organizer'
      };
    }

    await registration.save();

    // Populate participant details for confirmation message
    await registration.populate('participant', 'firstName lastName');

    res.json({
      message: 'Attendance Marked Successfully',
      participant: `${registration.participant.firstName} ${registration.participant.lastName}`,
      event: registration.event.title
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerForEvent,
  getMyRegistrations,
  updatePaymentStatus,
  markAttendance
};
