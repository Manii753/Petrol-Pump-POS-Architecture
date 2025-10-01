const express = require('express');
const { body, validationResult } = require('express-validator');
const Shift = require('../models/Shift');
const PumpReading = require('../models/PumpReading');
const Nozzle = require('../models/Nozzle');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/shifts/start
// @desc    Start a new shift
// @access  Private
router.post('/start', [
  auth,
  body('openingCash').isFloat({ min: 0 }).withMessage('Opening cash must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { openingCash, openingReadings } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user already has an open shift today
    const existingShift = await Shift.findOne({
      userId: req.user.userId,
      shiftDate: { $gte: today },
      status: 'open'
    });

    if (existingShift) {
      return res.status(400).json({ message: 'You already have an open shift' });
    }

    // Create new shift
    const shift = new Shift({
      userId: req.user.userId,
      shiftDate: new Date(),
      startTime: new Date(),
      openingCash: openingCash || 0,
      status: 'open'
    });

    await shift.save();

    // Save opening readings if provided
    if (openingReadings && Array.isArray(openingReadings)) {
      for (const reading of openingReadings) {
        const pumpReading = new PumpReading({
          shiftId: shift._id,
          nozzleId: reading.nozzleId,
          readingType: 'opening',
          meterReading: reading.meterReading,
          recordedBy: req.user.userId
        });
        await pumpReading.save();
      }
    }

    // Populate shift with user details
    await shift.populate('userId', 'username fullName');

    res.status(201).json({
      message: 'Shift started successfully',
      shift
    });
  } catch (error) {
    console.error('Start shift error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/shifts/:id/close
// @desc    Close a shift
// @access  Private
router.put('/:id/close', [
  auth,
  body('closingCash').isFloat({ min: 0 }).withMessage('Closing cash must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { closingCash, closingReadings, notes } = req.body;
    
    // Find the shift
    const shift = await Shift.findOne({
      _id: req.params.id,
      userId: req.user.userId,
      status: 'open'
    });

    if (!shift) {
      return res.status(404).json({ message: 'Shift not found or already closed' });
    }

    // Save closing readings if provided
    if (closingReadings && Array.isArray(closingReadings)) {
      for (const reading of closingReadings) {
        const pumpReading = new PumpReading({
          shiftId: shift._id,
          nozzleId: reading.nozzleId,
          readingType: 'closing',
          meterReading: reading.meterReading,
          recordedBy: req.user.userId
        });
        await pumpReading.save();
      }
    }

    // Update shift
    shift.endTime = new Date();
    shift.closingCash = closingCash || 0;
    shift.status = 'closed';
    shift.notes = notes || '';

    await shift.save();

    // Populate shift details
    await shift.populate('userId', 'username fullName');

    res.json({
      message: 'Shift closed successfully',
      shift
    });
  } catch (error) {
    console.error('Close shift error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/shifts
// @desc    Get all shifts (admin/supervisor) or user's shifts (attendant)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // If not admin/supervisor, only show user's own shifts
    if (req.user.role === 'attendant') {
      query.userId = req.user.userId;
    }

    // Date filter
    if (req.query.date) {
      const date = new Date(req.query.date);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      query.shiftDate = {
        $gte: date,
        $lt: nextDate
      };
    }

    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    const shifts = await Shift.find(query)
      .populate('userId', 'username fullName')
      .sort({ shiftDate: -1, startTime: -1 });

    res.json(shifts);
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/shifts/current
// @desc    Get current open shift
// @access  Private
router.get('/current', auth, async (req, res) => {
  try {
    const shift = await Shift.findOne({
      userId: req.user.userId,
      status: 'open'
    }).populate('userId', 'username fullName');

    if (!shift) {
      return res.status(404).json({ message: 'No open shift found' });
    }

    res.json(shift);
  } catch (error) {
    console.error('Get current shift error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/shifts/:id
// @desc    Get shift details with readings
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id)
      .populate('userId', 'username fullName');

    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    // Check access permissions
    if (req.user.role === 'attendant' && shift.userId._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get pump readings
    const readings = await PumpReading.find({ shiftId: shift._id })
      .populate({
        path: 'nozzleId',
        populate: {
          path: 'pumpId fuelTypeId',
          select: 'pumpNumber name code'
        }
      })
      .populate('recordedBy', 'username fullName');

    res.json({
      shift,
      readings
    });
  } catch (error) {
    console.error('Get shift details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;