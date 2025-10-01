const mongoose = require('mongoose');

const pumpReadingSchema = new mongoose.Schema({
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: true
  },
  nozzleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Nozzle',
    required: true
  },
  readingType: {
    type: String,
    enum: ['opening', 'closing'],
    required: true
  },
  meterReading: {
    type: Number,
    required: true,
    min: 0
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
pumpReadingSchema.index({ shiftId: 1, nozzleId: 1, readingType: 1 }, { unique: true });

module.exports = mongoose.model('PumpReading', pumpReadingSchema);