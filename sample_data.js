// Sample data for Petrol Pump POS System
// Run this script to populate the database with sample data

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const FuelType = require('./models/FuelType');
const Pump = require('./models/Pump');
const Nozzle = require('./models/Nozzle');
const Tank = require('./models/Tank');
const Shift = require('./models/Shift');
const Sale = require('./models/Sale');
const Delivery = require('./models/Delivery');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petrol-pump-pos', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createSampleData = async () => {
  try {
    console.log('Creating sample data...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      FuelType.deleteMany({}),
      Pump.deleteMany({}),
      Nozzle.deleteMany({}),
      Tank.deleteMany({}),
      Shift.deleteMany({}),
      Sale.deleteMany({}),
      Delivery.deleteMany({})
    ]);

    // Create fuel types
    const fuelTypes = await FuelType.insertMany([
      { name: 'Petrol', code: 'PET', pricePerLitre: 280.50 },
      { name: 'Diesel', code: 'DSL', pricePerLitre: 275.75 },
      { name: 'Hi-Octane', code: 'HO', pricePerLitre: 320.00 },
      { name: 'Kerosene', code: 'KER', pricePerLitre: 265.25 }
    ]);

    console.log('Created fuel types:', fuelTypes.length);

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 10);
    const users = await User.insertMany([
      {
        username: 'admin',
        passwordHash: hashedPassword,
        fullName: 'System Administrator',
        role: 'admin'
      },
      {
        username: 'supervisor1',
        passwordHash: hashedPassword,
        fullName: 'Ahmed Supervisor',
        role: 'supervisor'
      },
      {
        username: 'attendant1',
        passwordHash: hashedPassword,
        fullName: 'Ali Attendant',
        role: 'attendant'
      },
      {
        username: 'attendant2',
        passwordHash: hashedPassword,
        fullName: 'Hassan Attendant',
        role: 'attendant'
      }
    ]);

    console.log('Created users:', users.length);

    // Create pumps
    const pumps = await Pump.insertMany([
      { pumpNumber: 'P1', name: 'Pump 1' },
      { pumpNumber: 'P2', name: 'Pump 2' },
      { pumpNumber: 'P3', name: 'Pump 3' },
      { pumpNumber: 'P4', name: 'Pump 4' }
    ]);

    console.log('Created pumps:', pumps.length);

    // Create nozzles
    const nozzles = [];
    pumps.forEach((pump, pumpIndex) => {
      // Pumps 1, 2, 4 have petrol and diesel
      if (pumpIndex !== 2) {
        nozzles.push(
          { pumpId: pump._id, nozzleNumber: 'N1', fuelTypeId: fuelTypes[0]._id }, // Petrol
          { pumpId: pump._id, nozzleNumber: 'N2', fuelTypeId: fuelTypes[1]._id }  // Diesel
        );
      } else {
        // Pump 3 has petrol and hi-octane
        nozzles.push(
          { pumpId: pump._id, nozzleNumber: 'N1', fuelTypeId: fuelTypes[0]._id }, // Petrol
          { pumpId: pump._id, nozzleNumber: 'N2', fuelTypeId: fuelTypes[2]._id }  // Hi-Octane
        );
      }
    });

    const createdNozzles = await Nozzle.insertMany(nozzles);
    console.log('Created nozzles:', createdNozzles.length);

    // Create tanks
    const tanks = await Tank.insertMany([
      {
        tankNumber: 'T1',
        fuelTypeId: fuelTypes[0]._id, // Petrol
        capacityLitres: 10000,
        currentStock: 8500,
        reorderLevel: 2000
      },
      {
        tankNumber: 'T2',
        fuelTypeId: fuelTypes[1]._id, // Diesel
        capacityLitres: 8000,
        currentStock: 6500,
        reorderLevel: 1500
      },
      {
        tankNumber: 'T3',
        fuelTypeId: fuelTypes[2]._id, // Hi-Octane
        capacityLitres: 5000,
        currentStock: 4200,
        reorderLevel: 1000
      }
    ]);

    console.log('Created tanks:', tanks.length);

    // Create a sample shift and sales for today
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Create a shift for attendant1
    const shift = await Shift.create({
      userId: users[2]._id, // attendant1
      shiftDate: todayStart,
      startTime: new Date(todayStart.getTime() + 8 * 60 * 60 * 1000), // 8 AM
      endTime: new Date(todayStart.getTime() + 16 * 60 * 60 * 1000), // 4 PM
      openingCash: 5000,
      closingCash: 8500,
      status: 'closed'
    });

    console.log('Created sample shift');

    // Create sample sales
    const sampleSales = [
      {
        shiftId: shift._id,
        nozzleId: createdNozzles[0]._id, // P1 N1 Petrol
        openingReading: 1000,
        closingReading: 1050,
        litresDispensed: 50,
        pricePerLitre: fuelTypes[0].pricePerLitre,
        totalAmount: 50 * fuelTypes[0].pricePerLitre,
        paymentMethod: 'cash',
        createdBy: users[2]._id
      },
      {
        shiftId: shift._id,
        nozzleId: createdNozzles[1]._id, // P1 N2 Diesel
        openingReading: 800,
        closingReading: 850,
        litresDispensed: 50,
        pricePerLitre: fuelTypes[1].pricePerLitre,
        totalAmount: 50 * fuelTypes[1].pricePerLitre,
        paymentMethod: 'card',
        createdBy: users[2]._id
      },
      {
        shiftId: shift._id,
        nozzleId: createdNozzles[4]._id, // P2 N1 Petrol
        openingReading: 1200,
        closingReading: 1270,
        litresDispensed: 70,
        pricePerLitre: fuelTypes[0].pricePerLitre,
        totalAmount: 70 * fuelTypes[0].pricePerLitre,
        paymentMethod: 'credit',
        createdBy: users[2]._id
      }
    ];

    await Sale.insertMany(sampleSales);
    console.log('Created sample sales:', sampleSales.length);

    // Create sample delivery
    const delivery = await Delivery.create({
      tankId: tanks[0]._id, // Petrol tank
      challanNumber: 'CH-2024-001',
      litresDelivered: 5000,
      deliveryDate: new Date(todayStart.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      supplierName: 'Pakistan State Oil',
      createdBy: users[1]._id // supervisor
    });

    console.log('Created sample delivery');

    console.log('\n=== Sample Data Created Successfully ===');
    console.log('Users:');
    console.log('- admin / password123 (Admin)');
    console.log('- supervisor1 / password123 (Supervisor)');
    console.log('- attendant1 / password123 (Attendant)');
    console.log('- attendant2 / password123 (Attendant)');
    console.log('\nFuel Types: Petrol, Diesel, Hi-Octane, Kerosene');
    console.log('Pumps: P1, P2, P3, P4');
    console.log('Tanks: T1 (Petrol), T2 (Diesel), T3 (Hi-Octane)');
    console.log('\nSample shift and sales data created for today');

    process.exit(0);
  } catch (error) {
    console.error('Error creating sample data:', error);
    process.exit(1);
  }
};

createSampleData();