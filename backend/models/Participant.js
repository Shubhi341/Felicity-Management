const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: {
      type: String,
      unique: true
    },
    password: String,

    role: {
      type: String,
      enum: ['participant', 'organizer', 'admin'],
      default: 'participant'
    },

    participantType: String,
    collegeName: String,
    contactNumber: String,

    // Participant Preferences
    interests: {
      type: [String],
      default: []
    },
    followedOrganizers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant'
    }],

    // Organizer Details
    organizerName: String, // Display name for the club/org
    category: String,      // e.g., Technical, Cultural, etc.
    description: String,
    contactEmail: String,  // Public contact email
    discordWebhook: String, // Webhook to auto-post events
    approved: {
      type: Boolean,
      default: true // Admin creates them, so default approved.
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Participant', participantSchema);
