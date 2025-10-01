const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  tankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tank',
    required: true
  },
  challanNumber: {
    type: String,
    required: true,
    trim: true
  },
  litresDelivered: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  supplierName: String,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Delivery', deliverySchema);