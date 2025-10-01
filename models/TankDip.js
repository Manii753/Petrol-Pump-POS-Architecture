const mongoose = require('mongoose');

const tankDipSchema = new mongoose.Schema({
  tankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tank',
    required: true
  },
  dipReading: {
    type: Number,
    required: true,
    min: 0
  },
  temperature: {
    type: Number,
    min: -50,
    max: 100
  },
  recordedDate: {
    type: Date,
    required: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('TankDip', tankDipSchema);