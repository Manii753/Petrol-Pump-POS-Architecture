const express = require('express');
const { body, validationResult } = require('express-validator');
const Tank = require('../models/Tank');
const Delivery = require('../models/Delivery');
const TankDip = require('../models/TankDip');
const FuelType = require('../models/FuelType');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/tanks
// @desc    Get all tanks with current stock
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const tanks = await Tank.find()
      .populate('fuelTypeId', 'name code pricePerLitre')
      .sort({ tankNumber: 1 });

    res.json(tanks);
  } catch (error) {
    console.error('Get tanks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tanks
// @desc    Create new tank (Admin only)
// @access  Private/Admin
router.post('/', [
  auth,
  body('tankNumber').trim().isLength({ min: 1 }).withMessage('Tank number is required'),
  body('fuelTypeId').isMongoId().withMessage('Valid fuel type ID is required'),
  body('capacityLitres').isFloat({ min: 0 }).withMessage('Capacity must be a positive number'),
  body('currentStock').optional().isFloat({ min: 0 }).withMessage('Current stock must be a positive number'),
  body('reorderLevel').optional().isFloat({ min: 0 }).withMessage('Reorder level must be a positive number')
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tankNumber, fuelTypeId, capacityLitres, currentStock, reorderLevel } = req.body;

    // Check if tank already exists
    const existingTank = await Tank.findOne({ tankNumber });
    if (existingTank) {
      return res.status(400).json({ message: 'Tank number already exists' });
    }

    // Create tank
    const tank = new Tank({
      tankNumber,
      fuelTypeId,
      capacityLitres,
      currentStock: currentStock || 0,
      reorderLevel: reorderLevel || 0
    });

    await tank.save();

    // Populate fuel type details
    await tank.populate('fuelTypeId', 'name code pricePerLitre');

    res.status(201).json({
      message: 'Tank created successfully',
      tank
    });
  } catch (error) {
    console.error('Create tank error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tanks/:id
// @desc    Update tank (Admin only)
// @access  Private/Admin
router.put('/:id', [
  auth,
  body('tankNumber').trim().isLength({ min: 1 }).withMessage('Tank number is required'),
  body('fuelTypeId').isMongoId().withMessage('Valid fuel type ID is required'),
  body('capacityLitres').isFloat({ min: 0 }).withMessage('Capacity must be a positive number'),
  body('currentStock').isFloat({ min: 0 }).withMessage('Current stock must be a positive number'),
  body('reorderLevel').isFloat({ min: 0 }).withMessage('Reorder level must be a positive number')
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tankNumber, fuelTypeId, capacityLitres, currentStock, reorderLevel } = req.body;

    const tank = await Tank.findById(req.params.id);
    if (!tank) {
      return res.status(404).json({ message: 'Tank not found' });
    }

    // Check if tank number is unique (excluding current tank)
    const existingTank = await Tank.findOne({ 
      tankNumber, 
      _id: { $ne: req.params.id } 
    });
    if (existingTank) {
      return res.status(400).json({ message: 'Tank number already exists' });
    }

    // Update tank
    tank.tankNumber = tankNumber;
    tank.fuelTypeId = fuelTypeId;
    tank.capacityLitres = capacityLitres;
    tank.currentStock = currentStock;
    tank.reorderLevel = reorderLevel;

    await tank.save();

    // Populate fuel type details
    await tank.populate('fuelTypeId', 'name code pricePerLitre');

    res.json({
      message: 'Tank updated successfully',
      tank
    });
  } catch (error) {
    console.error('Update tank error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tanks/delivery
// @desc    Record fuel delivery
// @access  Private
router.post('/delivery', [
  auth,
  body('tankId').isMongoId().withMessage('Valid tank ID is required'),
  body('challanNumber').trim().isLength({ min: 1 }).withMessage('Challan number is required'),
  body('litresDelivered').isFloat({ min: 0 }).withMessage('Litres delivered must be a positive number'),
  body('deliveryDate').isISO8601().withMessage('Valid delivery date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tankId, challanNumber, litresDelivered, deliveryDate, supplierName, notes } = req.body;

    // Check if tank exists
    const tank = await Tank.findById(tankId);
    if (!tank) {
      return res.status(400).json({ message: 'Invalid tank' });
    }

    // Record delivery
    const delivery = new Delivery({
      tankId,
      challanNumber,
      litresDelivered,
      deliveryDate: new Date(deliveryDate),
      supplierName,
      notes,
      createdBy: req.user.userId
    });

    await delivery.save();

    // Update tank stock
    tank.currentStock += litresDelivered;
    await tank.save();

    // Populate delivery details
    await delivery.populate([
      { path: 'tankId', populate: { path: 'fuelTypeId', select: 'name code' } },
      { path: 'createdBy', select: 'username fullName' }
    ]);

    res.status(201).json({
      message: 'Delivery recorded successfully',
      delivery
    });
  } catch (error) {
    console.error('Record delivery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tanks/deliveries
// @desc    Get fuel deliveries
// @access  Private
router.get('/deliveries', auth, async (req, res) => {
  try {
    let query = {};

    // Filter by tank
    if (req.query.tankId) {
      query.tankId = req.query.tankId;
    }

    // Filter by date
    if (req.query.date) {
      const date = new Date(req.query.date);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      query.deliveryDate = {
        $gte: date,
        $lt: nextDate
      };
    }

    const deliveries = await Delivery.find(query)
      .populate({
        path: 'tankId',
        populate: {
          path: 'fuelTypeId',
          select: 'name code'
        }
      })
      .populate('createdBy', 'username fullName')
      .sort({ deliveryDate: -1 });

    res.json(deliveries);
  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/tanks/:id
// @desc    Delete a tank (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tank = await Tank.findById(req.params.id);
    if (!tank) {
      return res.status(404).json({ message: 'Tank not found' });
    }

    await tank.deleteOne();

    res.json({ message: 'Tank deleted successfully' });
  } catch (error) {
    console.error('Delete tank error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;