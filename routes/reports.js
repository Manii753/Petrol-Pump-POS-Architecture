const express = require('express');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Shift = require('../models/Shift');
const Sale = require('../models/Sale');
const PumpReading = require('../models/PumpReading');
const Delivery = require('../models/Delivery');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports/daily-shift/:shiftId
// @desc    Generate daily shift report
// @access  Private
router.get('/daily-shift/:shiftId', auth, async (req, res) => {
  try {
    const { shiftId } = req.params;

    // Check access permissions
    const shift = await Shift.findById(shiftId).populate('userId', 'username fullName');
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    if (req.user.role === 'attendant' && shift.userId._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get shift readings
    const readings = await PumpReading.find({ shiftId })
      .populate({
        path: 'nozzleId',
        populate: {
          path: 'pumpId fuelTypeId',
          select: 'pumpNumber name code'
        }
      });

    // Get sales for the shift
    const sales = await Sale.find({ shiftId })
      .populate({
        path: 'nozzleId',
        populate: {
          path: 'pumpId fuelTypeId',
          select: 'pumpNumber name code'
        }
      });

    // Calculate totals
    const totals = {
      totalLitres: sales.reduce((sum, sale) => sum + sale.litresDispensed, 0),
      totalAmount: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      cashAmount: sales.filter(s => s.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.totalAmount, 0),
      cardAmount: sales.filter(s => s.paymentMethod === 'card').reduce((sum, sale) => sum + sale.totalAmount, 0),
      creditAmount: sales.filter(s => s.paymentMethod === 'credit').reduce((sum, sale) => sum + sale.totalAmount, 0)
    };

    // Group readings by pump and fuel type
    const pumpReadings = {};
    readings.forEach(reading => {
      const pump = reading.nozzleId.pumpId.pumpNumber;
      const fuelType = reading.nozzleId.fuelTypeId.name;
      const key = `${pump}-${fuelType}`;
      
      if (!pumpReadings[key]) {
        pumpReadings[key] = {
          pump,
          fuelType,
          opening: 0,
          closing: 0
        };
      }
      
      if (reading.readingType === 'opening') {
        pumpReadings[key].opening = reading.meterReading;
      } else {
        pumpReadings[key].closing = reading.meterReading;
      }
    });

    const report = {
      shift,
      readings: Object.values(pumpReadings),
      sales,
      totals,
      generatedAt: new Date()
    };

    res.json(report);
  } catch (error) {
    console.error('Generate daily shift report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/daily-sales
// @desc    Generate daily sales report
// @access  Private
router.get('/daily-sales', auth, async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    let shiftQuery = {
      shiftDate: {
        $gte: date,
        $lt: nextDate
      }
    };

    // If attendant, only show their shifts
    if (req.user.role === 'attendant') {
      shiftQuery.userId = req.user.userId;
    }

    const shifts = await Shift.find(shiftQuery).populate('userId', 'username fullName');
    const shiftIds = shifts.map(shift => shift._id);

    const sales = await Sale.find({ shiftId: { $in: shiftIds } })
      .populate({
        path: 'nozzleId',
        populate: {
          path: 'pumpId fuelTypeId',
          select: 'pumpNumber name code'
        }
      })
      .populate('shiftId', 'shiftDate userId')
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 });

    // Calculate summary
    const summary = {
      totalShifts: shifts.length,
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
      date: date.toISOString().split('T')[0],
      shifts,
      sales,
      summary
    });
  } catch (error) {
    console.error('Generate daily sales report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/monthly-sales
// @desc    Generate monthly sales report
// @access  Private
router.get('/monthly-sales', auth, async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    let shiftQuery = {
      shiftDate: {
        $gte: startDate,
        $lt: endDate
      }
    };

    // If attendant, only show their shifts
    if (req.user.role === 'attendant') {
      shiftQuery.userId = req.user.userId;
    }

    const shifts = await Shift.find(shiftQuery);
    const shiftIds = shifts.map(shift => shift._id);

    const sales = await Sale.find({ shiftId: { $in: shiftIds } })
      .populate({
        path: 'nozzleId',
        populate: {
          path: 'fuelTypeId',
          select: 'name code'
        }
      });

    // Group sales by day
    const dailySales = {};
    for (let day = 1; day <= new Date(year, month, 0).getDate(); day++) {
      const date = new Date(year, month - 1, day).toISOString().split('T')[0];
      dailySales[date] = {
        litres: 0,
        amount: 0,
        cash: 0,
        card: 0,
        credit: 0,
        count: 0
      };
    }

    sales.forEach(sale => {
      const date = sale.createdAt.toISOString().split('T')[0];
      if (dailySales[date]) {
        dailySales[date].litres += sale.litresDispensed;
        dailySales[date].amount += sale.totalAmount;
        dailySales[date][sale.paymentMethod] += sale.totalAmount;
        dailySales[date].count += 1;
      }
    });

    const summary = {
      totalDays: Object.keys(dailySales).length,
      totalSales: sales.length,
      totalLitres: sales.reduce((sum, sale) => sum + sale.litresDispensed, 0),
      totalAmount: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      cashAmount: sales.filter(s => s.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.totalAmount, 0),
      cardAmount: sales.filter(s => s.paymentMethod === 'card').reduce((sum, sale) => sum + sale.totalAmount, 0),
      creditAmount: sales.filter(s => s.paymentMethod === 'credit').reduce((sum, sale) => sum + sale.totalAmount, 0)
    };

    res.json({
      month: `${year}-${month.toString().padStart(2, '0')}`,
      dailySales,
      summary
    });
  } catch (error) {
    console.error('Generate monthly sales report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/export-pdf/:shiftId
// @desc    Export shift report as PDF
// @access  Private
router.get('/export-pdf/:shiftId', auth, async (req, res) => {
  try {
    const { shiftId } = req.params;

    // Get shift data (similar to daily shift report)
    const shift = await Shift.findById(shiftId).populate('userId', 'username fullName');
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    if (req.user.role === 'attendant' && shift.userId._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const sales = await Sale.find({ shiftId })
      .populate({
        path: 'nozzleId',
        populate: {
          path: 'pumpId fuelTypeId',
          select: 'pumpNumber name code'
        }
      });

    // Create PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=shift-report-${shiftId}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Petrol Pump POS System', 50, 50);
    doc.fontSize(16).text('Daily Shift Report', 50, 80);
    
    // Shift details
    doc.fontSize(12);
    doc.text(`Shift Date: ${shift.shiftDate.toDateString()}`, 50, 120);
    doc.text(`Attendant: ${shift.userId.fullName}`, 50, 140);
    doc.text(`Start Time: ${shift.startTime.toLocaleTimeString()}`, 50, 160);
    doc.text(`End Time: ${shift.endTime ? shift.endTime.toLocaleTimeString() : 'Open'}`, 50, 180);
    
    // Sales summary
    doc.fontSize(14).text('Sales Summary', 50, 220);
    doc.fontSize(12);
    
    const totalLitres = sales.reduce((sum, sale) => sum + sale.litresDispensed, 0);
    const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    doc.text(`Total Sales: ${sales.length}`, 50, 250);
    doc.text(`Total Litres: ${totalLitres.toFixed(2)}`, 50, 270);
    doc.text(`Total Amount: PKR ${totalAmount.toFixed(2)}`, 50, 290);
    
    // Sales details table
    doc.fontSize(14).text('Sales Details', 50, 330);
    doc.fontSize(10);
    
    let y = 360;
    doc.text('Pump', 50, y);
    doc.text('Fuel Type', 100, y);
    doc.text('Litres', 200, y);
    doc.text('Amount', 250, y);
    doc.text('Payment', 320, y);
    
    y += 20;
    sales.forEach(sale => {
      doc.text(sale.nozzleId.pumpId.pumpNumber, 50, y);
      doc.text(sale.nozzleId.fuelTypeId.name, 100, y);
      doc.text(sale.litresDispensed.toFixed(2), 200, y);
      doc.text(sale.totalAmount.toFixed(2), 250, y);
      doc.text(sale.paymentMethod, 320, y);
      y += 15;
    });

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;