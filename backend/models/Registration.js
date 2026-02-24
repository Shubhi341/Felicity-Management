const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant',
      required: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    ticketId: {
      type: String,
      unique: true,
      required: true
    },

    // Custom Form Answers
    answers: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    // For Merchandise
    merchandiseVariant: {
      type: String
    },
    quantity: {
      type: Number,
      default: 1
    },

    // Advanced Features
    paymentProofUrl: {
      type: String // URL to uploaded image
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'successful'], // 'successful' is for approved
      default: 'pending'
    },
    attended: {
      type: Boolean,
      default: false
    },
    attendanceTimestamp: {
      type: Date
    },
    attendanceMethod: {
      type: String,
      enum: ['QR Scan', 'Manual Override']
    },
    attendanceLog: {
      actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant' },
      reason: { type: String }
    },

    registrationDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Prevent duplicate registration for same participant & event
registrationSchema.index({ participant: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
