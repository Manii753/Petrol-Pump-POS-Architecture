const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shiftDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    default: null
  },
  openingCash: {
    type: Number,
    default: 0,
    min: 0
  },
  closingCash: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  notes: String
}, {
  timestamps: true
});

// Index for efficient querying
shiftSchema.index({ userId: 1, shiftDate: 1 });
shiftSchema.index({ status: 1 });

module.exports = mongoose.model('Shift', shiftSchema);