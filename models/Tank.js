const mongoose = require('mongoose');

const tankSchema = new mongoose.Schema({
  tankNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fuelTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FuelType',
    required: true
  },
  capacityLitres: {
    type: Number,
    required: true,
    min: 0
  },
  currentStock: {
    type: Number,
    default: 0,
    min: 0
  },
  reorderLevel: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tank', tankSchema);