const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    location: {
      type: String,
      required: true,
      default: 'TBD'
    },

    eventType: {
      type: String,
      enum: ['normal', 'merchandise'],
      required: true
    },

    eligibility: {
      type: String,
      default: 'Open to all'
    },

    registrationDeadline: {
      type: Date,
      required: true
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    registrationLimit: {
      type: Number,
      default: 0   // 0 means unlimited
    },

    registrationFee: {
      type: Number,
      default: 0
    },

    eventTags: {
      type: [String],
      default: []
    },

    // Merchandise Specifics
    merchandiseVariants: [{
      variantName: String,
      color: String,
      size: String,
      stock: Number
    }],
    purchaseLimit: {
      type: Number,
      default: 1
    },

    // Dynamic Form Builder
    formSchema: {
      type: [Object], // Array of field definitions { label, type, required, options }
      default: []
    },

    status: {
      type: String,
      enum: ['draft', 'published', 'ongoing', 'closed'],
      default: 'draft'
    },

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
