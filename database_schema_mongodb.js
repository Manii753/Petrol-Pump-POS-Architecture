// Petrol Pump POS System - MongoDB Schema
// Complete database design for Pakistan petrol pump management

// Users Collection
{
  _id: ObjectId,
  username: String, // unique
  passwordHash: String,
  fullName: String,
  role: String, // 'attendant', 'supervisor', 'admin'
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}

// FuelTypes Collection
{
  _id: ObjectId,
  name: String, // unique
  code: String, // unique
  pricePerLitre: Number,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}

// Pumps Collection
{
  _id: ObjectId,
  pumpNumber: String, // unique
  name: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}

// Nozzles Collection
{
  _id: ObjectId,
  pumpId: ObjectId, // reference to Pumps
  nozzleNumber: String,
  fuelTypeId: ObjectId, // reference to FuelTypes
  createdAt: { type: Date, default: Date.now }
}

// Tanks Collection
{
  _id: ObjectId,
  tankNumber: String, // unique
  fuelTypeId: ObjectId, // reference to FuelTypes
  capacityLitres: Number,
  currentStock: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}

// Shifts Collection
{
  _id: ObjectId,
  userId: ObjectId, // reference to Users
  shiftDate: Date,
  startTime: Date,
  endTime: Date,
  openingCash: { type: Number, default: 0 },
  closingCash: { type: Number, default: 0 },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  notes: String,
  createdAt: { type: Date, default: Date.now }
}

// PumpReadings Collection
{
  _id: ObjectId,
  shiftId: ObjectId, // reference to Shifts
  nozzleId: ObjectId, // reference to Nozzles
  readingType: { type: String, enum: ['opening', 'closing'] },
  meterReading: Number,
  recordedAt: { type: Date, default: Date.now },
  recordedBy: ObjectId // reference to Users
}

// Sales Collection
{
  _id: ObjectId,
  shiftId: ObjectId, // reference to Shifts
  nozzleId: ObjectId, // reference to Nozzles
  openingReading: Number,
  closingReading: Number,
  litresDispensed: Number, // calculated: closingReading - openingReading
  pricePerLitre: Number,
  totalAmount: Number, // calculated: litresDispensed * pricePerLitre
  paymentMethod: { type: String, enum: ['cash', 'card', 'credit'] },
  createdAt: { type: Date, default: Date.now },
  createdBy: ObjectId // reference to Users
}

// Deliveries Collection
{
  _id: ObjectId,
  tankId: ObjectId, // reference to Tanks
  challanNumber: String,
  litresDelivered: Number,
  deliveryDate: Date,
  supplierName: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  createdBy: ObjectId // reference to Users
}

// TankDips Collection
{
  _id: ObjectId,
  tankId: ObjectId, // reference to Tanks
  dipReading: Number,
  temperature: Number,
  recordedDate: Date,
  recordedBy: ObjectId, // reference to Users
  notes: String,
  createdAt: { type: Date, default: Date.now }
}

// PaymentReconciliation Collection
{
  _id: ObjectId,
  shiftId: ObjectId, // reference to Shifts
  paymentMethod: String,
  expectedAmount: Number,
  actualAmount: Number,
  difference: Number, // calculated: actualAmount - expectedAmount
  notes: String,
  createdAt: { type: Date, default: Date.now }
}

// AuditLog Collection
{
  _id: ObjectId,
  collectionName: String,
  documentId: ObjectId,
  action: { type: String, enum: ['insert', 'update', 'delete'] },
  oldValues: Object,
  newValues: Object,
  userId: ObjectId, // reference to Users
  timestamp: { type: Date, default: Date.now }
}

// Indexes for MongoDB
// Users
// { username: 1 } - unique

// Shifts  
// { userId: 1, shiftDate: 1 }
// { status: 1 }

// Sales
// { shiftId: 1 }
// { createdAt: 1 }
// { paymentMethod: 1 }

// PumpReadings
// { shiftId: 1, nozzleId: 1, readingType: 1 }

// Tanks
// { tankNumber: 1 } - unique

// Nozzles
// { pumpId: 1, nozzleNumber: 1 } - unique