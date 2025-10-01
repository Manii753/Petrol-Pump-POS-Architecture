const mongoose = require('mongoose');

const nozzleSchema = new mongoose.Schema({
  pumpId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pump',
    required: true
  },
  nozzleNumber: {
    type: String,
    required: true,
    trim: true
  },
  fuelTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FuelType',
    required: true
  }
}, {
  timestamps: true
});

// Ensure unique nozzle number per pump
nozzleSchema.index({ pumpId: 1, nozzleNumber: 1 }, { unique: true });

module.exports = mongoose.model('Nozzle', nozzleSchema);