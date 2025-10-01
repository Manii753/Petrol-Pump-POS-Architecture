const express = require('express');
const { body, validationResult } = require('express-validator');
const Pump = require('../models/Pump');
const Nozzle = require('../models/Nozzle');
const FuelType = require('../models/FuelType');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/pumps
// @desc    Get all pumps with nozzles
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const pumps = await Pump.find({ isActive: true })
      .sort({ pumpNumber: 1 });

    // Get nozzles for each pump
    const pumpsWithNozzles = await Promise.all(
      pumps.map(async (pump) => {
        const nozzles = await Nozzle.find({ pumpId: pump._id })
          .populate('fuelTypeId', 'name code pricePerLitre');
        
        return {
          ...pump.toObject(),
          nozzles
        };
      })
    );

    res.json(pumpsWithNozzles);
  } catch (error) {
    console.error('Get pumps error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/pumps
// @desc    Create new pump (Admin only)
// @access  Private/Admin
router.post('/', [
  auth,
  body('pumpNumber').trim().isLength({ min: 1 }).withMessage('Pump number is required'),
  body('name').trim().isLength({ min: 1 }).withMessage('Pump name is required')
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { pumpNumber, name, nozzles } = req.body;

    // Check if pump already exists
    const existingPump = await Pump.findOne({ pumpNumber });
    if (existingPump) {
      return res.status(400).json({ message: 'Pump number already exists' });
    }

    // Create pump
    const pump = new Pump({ pumpNumber, name });
    await pump.save();

    // Create nozzles if provided
    if (nozzles && Array.isArray(nozzles)) {
      for (const nozzle of nozzles) {
        const newNozzle = new Nozzle({
          pumpId: pump._id,
          nozzleNumber: nozzle.nozzleNumber,
          fuelTypeId: nozzle.fuelTypeId
        });
        await newNozzle.save();
      }
    }

    // Return pump with nozzles
    const pumpWithNozzles = {
      ...pump.toObject(),
      nozzles: await Nozzle.find({ pumpId: pump._id })
        .populate('fuelTypeId', 'name code pricePerLitre')
    };

    res.status(201).json({
      message: 'Pump created successfully',
      pump: pumpWithNozzles
    });
  } catch (error) {
    console.error('Create pump error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/pumps/:id
// @desc    Update pump (Admin only)
// @access  Private/Admin
router.put('/:id', [
  auth,
  body('pumpNumber').trim().isLength({ min: 1 }).withMessage('Pump number is required'),
  body('name').trim().isLength({ min: 1 }).withMessage('Pump name is required')
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { pumpNumber, name, nozzles } = req.body;

    // Check if pump exists
    const pump = await Pump.findById(req.params.id);
    if (!pump) {
      return res.status(404).json({ message: 'Pump not found' });
    }

    // Check if pump number is unique (excluding current pump)
    const existingPump = await Pump.findOne({ 
      pumpNumber, 
      _id: { $ne: req.params.id } 
    });
    if (existingPump) {
      return res.status(400).json({ message: 'Pump number already exists' });
    }

    // Update pump
    pump.pumpNumber = pumpNumber;
    pump.name = name;
    await pump.save();

    // Update nozzles if provided
    if (nozzles && Array.isArray(nozzles)) {
      // Remove existing nozzles
      await Nozzle.deleteMany({ pumpId: pump._id });
      
      // Create new nozzles
      for (const nozzle of nozzles) {
        const newNozzle = new Nozzle({
          pumpId: pump._id,
          nozzleNumber: nozzle.nozzleNumber,
          fuelTypeId: nozzle.fuelTypeId
        });
        await newNozzle.save();
      }
    }

    // Return updated pump with nozzles
    const pumpWithNozzles = {
      ...pump.toObject(),
      nozzles: await Nozzle.find({ pumpId: pump._id })
        .populate('fuelTypeId', 'name code pricePerLitre')
    };

    res.json({
      message: 'Pump updated successfully',
      pump: pumpWithNozzles
    });
  } catch (error) {
    console.error('Update pump error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/pumps/:id
// @desc    Delete pump (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const pump = await Pump.findById(req.params.id);
    if (!pump) {
      return res.status(404).json({ message: 'Pump not found' });
    }

    // Soft delete by setting isActive to false
    pump.isActive = false;
    await pump.save();

    res.json({ message: 'Pump deleted successfully' });
  } catch (error) {
    console.error('Delete pump error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;