const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
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
  openingReading: {
    type: Number,
    required: true,
    min: 0
  },
  closingReading: {
    type: Number,
    required: true,
    min: 0
  },
  litresDispensed: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerLitre: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'credit'],
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
saleSchema.index({ shiftId: 1 });
saleSchema.index({ createdAt: 1 });
saleSchema.index({ paymentMethod: 1 });

module.exports = mongoose.model('Sale', saleSchema);