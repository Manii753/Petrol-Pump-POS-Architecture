const express = require('express');
const { body, validationResult } = require('express-validator');
const Sale = require('../models/Sale');
const Shift = require('../models/Shift');
const Nozzle = require('../models/Nozzle');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/sales
// @desc    Record a sale
// @access  Private
router.post('/', [
  auth,
  body('nozzleId').isMongoId().withMessage('Valid nozzle ID is required'),
  body('openingReading').isFloat({ min: 0 }).withMessage('Opening reading must be a positive number'),
  body('closingReading').isFloat({ min: 0 }).withMessage('Closing reading must be a positive number'),
  body('paymentMethod').isIn(['cash', 'card', 'credit']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nozzleId, openingReading, closingReading, paymentMethod } = req.body;

    // Check if user has an open shift
    const shift = await Shift.findOne({
      userId: req.user.userId,
      status: 'open'
    });

    if (!shift) {
      return res.status(400).json({ message: 'No open shift found. Please start a shift first.' });
    }

    // Validate nozzle
    const nozzle = await Nozzle.findById(nozzleId).populate('fuelTypeId');
    if (!nozzle) {
      return res.status(400).json({ message: 'Invalid nozzle' });
    }

    // Validate readings
    if (closingReading <= openingReading) {
      return res.status(400).json({ message: 'Closing reading must be greater than opening reading' });
    }

    const litresDispensed = closingReading - openingReading;
    const pricePerLitre = nozzle.fuelTypeId.pricePerLitre;
    const totalAmount = litresDispensed * pricePerLitre;

    // Create sale
    const sale = new Sale({
      shiftId: shift._id,
      nozzleId,
      openingReading,
      closingReading,
      litresDispensed,
      pricePerLitre,
      totalAmount,
      paymentMethod,
      createdBy: req.user.userId
    });

    await sale.save();

    // Populate sale details
    await sale.populate([
      { path: 'nozzleId', populate: { path: 'pumpId fuelTypeId', select: 'pumpNumber name code' } },
      { path: 'createdBy', select: 'username fullName' }
    ]);

    res.status(201).json({
      message: 'Sale recorded successfully',
      sale
    });
  } catch (error) {
    console.error('Record sale error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/sales
// @desc    Get sales (filtered by shift, date, etc.)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    // Filter by shift
    if (req.query.shiftId) {
      query.shiftId = req.query.shiftId;
    }

    // Filter by date
    if (req.query.date) {
      const date = new Date(req.query.date);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      query.createdAt = {
        $gte: date,
        $lt: nextDate
      };
    }

    // Filter by payment method
    if (req.query.paymentMethod) {
      query.paymentMethod = req.query.paymentMethod;
    }

    // If attendant, only show sales from their shifts
    if (req.user.role === 'attendant') {
      const userShifts = await Shift.find({ userId: req.user.userId }).select('_id');
      const shiftIds = userShifts.map(shift => shift._id);
      query.shiftId = { $in: shiftIds };
    }

    const sales = await Sale.find(query)
      .populate({
        path: 'nozzleId',
        populate: {
          path: 'pumpId fuelTypeId',
          select: 'pumpNumber name code'
        }
      })
      .populate('shiftId', 'shiftDate startTime endTime')
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 });

    res.json(sales);
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/sales/shift-summary/:shiftId
// @desc    Get sales summary for a shift
// @access  Private
router.get('/shift-summary/:shiftId', auth, async (req, res) => {
  try {
    const { shiftId } = req.params;

    // Check if user has access to this shift
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    if (req.user.role === 'attendant' && shift.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get sales for the shift
    const sales = await Sale.find({ shiftId })
      .populate({
        path: 'nozzleId',
        populate: {
          path: 'pumpId fuelTypeId',
          select: 'pumpNumber name code'
        }
      });

    // Calculate summary
    const summary = {
      totalSales: sales.length,
      totalLitres: sales.reduce((sum, sale) => sum + sale.litresDispensed, 0),
      totalAmount: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      cashAmount: sales.filter(s => s.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.totalAmount, 0),
      cardAmount: sales.filter(s => s.paymentMethod === 'card').reduce((sum, sale) => sum + sale.totalAmount, 0),
      creditAmount: sales.filter(s => s.paymentMethod === 'credit').reduce((sum, sale) => sum + sale.totalAmount, 0),
      salesByFuelType: {},
      salesByPump: {}
    };

    // Group by fuel type
    sales.forEach(sale => {
      const fuelType = sale.nozzleId.fuelTypeId.name;
      if (!summary.salesByFuelType[fuelType]) {
        summary.salesByFuelType[fuelType] = {
          litres: 0,
          amount: 0,
          count: 0
        };
      }
      summary.salesByFuelType[fuelType].litres += sale.litresDispensed;
      summary.salesByFuelType[fuelType].amount += sale.totalAmount;
      summary.salesByFuelType[fuelType].count += 1;
    });

    // Group by pump
    sales.forEach(sale => {
      const pump = sale.nozzleId.pumpId.pumpNumber;
      if (!summary.salesByPump[pump]) {
        summary.salesByPump[pump] = {
          litres: 0,
          amount: 0,
          count: 0
        };
      }
      summary.salesByPump[pump].litres += sale.litresDispensed;
      summary.salesByPump[pump].amount += sale.totalAmount;
      summary.salesByPump[pump].count += 1;
    });

    res.json({
      shift,
      sales,
      summary
    });
  } catch (error) {
    console.error('Get shift summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;