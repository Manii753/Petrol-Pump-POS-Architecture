'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { salesAPI, shiftsAPI, pumpsAPI } from '@/lib/api';

export default function Sales() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [pumps, setPumps] = useState([]);
  const [currentShift, setCurrentShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [formData, setFormData] = useState({
    nozzleId: '',
    openingReading: '',
    closingReading: '',
    paymentMethod: 'cash'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [salesResponse, pumpsResponse] = await Promise.all([
        salesAPI.getSales(),
        pumpsAPI.getPumps()
      ]);
      
      setSales(salesResponse.data);
      setPumps(pumpsResponse.data);

      // Check for current shift
      try {
        const shiftResponse = await shiftsAPI.getCurrentShift();
        setCurrentShift(shiftResponse.data);
      } catch (error) {
        // No open shift
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSale = async (e) => {
    e.preventDefault();
    try {
      await salesAPI.createSale({
        nozzleId: formData.nozzleId,
        openingReading: parseFloat(formData.openingReading),
        closingReading: parseFloat(formData.closingReading),
        paymentMethod: formData.paymentMethod
      });
      
      setShowSaleModal(false);
      setFormData({
        nozzleId: '',
        openingReading: '',
        closingReading: '',
        paymentMethod: 'cash'
      });
      
      loadData();
    } catch (error) {
      console.error('Failed to create sale:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR'
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Sales</h1>
            <p className="text-secondary-600 mt-1">
              Record and view fuel sales transactions
            </p>
          </div>
          <div className="space-x-3">
            {currentShift && (
              <button
                onClick={() => setShowSaleModal(true)}
                className="btn-primary"
              >
                Record Sale
              </button>
            )}
          </div>
        </div>

        {/* No Shift Warning */}
        {!currentShift && (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-warning-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-warning-800">
                  No Active Shift
                </h3>
                <div className="mt-2 text-sm text-warning-700">
                  <p>You need to start a shift before you can record sales.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Date & Time</th>
                  <th className="table-header-cell">Pump</th>
                  <th className="table-header-cell">Fuel Type</th>
                  <th className="table-header-cell">Opening</th>
                  <th className="table-header-cell">Closing</th>
                  <th className="table-header-cell">Litres</th>
                  <th className="table-header-cell">Rate</th>
                  <th className="table-header-cell">Amount</th>
                  <th className="table-header-cell">Payment</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {sales.map((sale) => (
                  <tr key={sale._id}>
                    <td className="table-body-cell">
                      {new Date(sale.createdAt).toLocaleString()}
                    </td>
                    <td className="table-body-cell">
                      {sale.nozzleId?.pumpId?.pumpNumber || 'Unknown'}
                    </td>
                    <td className="table-body-cell">
                      {sale.nozzleId?.fuelTypeId?.name || 'Unknown'}
                    </td>
                    <td className="table-body-cell">
                      {sale.openingReading.toFixed(2)}
                    </td>
                    <td className="table-body-cell">
                      {sale.closingReading.toFixed(2)}
                    </td>
                    <td className="table-body-cell">
                      {sale.litresDispensed.toFixed(2)}
                    </td>
                    <td className="table-body-cell">
                      {formatCurrency(sale.pricePerLitre)}
                    </td>
                    <td className="table-body-cell font-medium">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="table-body-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' :
                        sale.paymentMethod === 'card' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sale Modal */}
      {showSaleModal && currentShift && (
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">Record Fuel Sale</h3>
            <form onSubmit={handleCreateSale}>
              <div className="mb-4">
                <label className="form-label">Pump & Nozzle</label>
                <select
                  required
                  value={formData.nozzleId}
                  onChange={(e) => setFormData({ ...formData, nozzleId: e.target.value })}
                  className="form-input"
                >
                  <option value="">Select pump and nozzle</option>
                  {pumps.map((pump) => 
                    pump.nozzles.map((nozzle) => (
                      <option key={nozzle._id} value={nozzle._id}>
                        {pump.pumpNumber} - {nozzle.nozzleNumber} ({nozzle.fuelTypeId?.name})
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="form-label">Opening Reading</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.openingReading}
                  onChange={(e) => setFormData({ ...formData, openingReading: e.target.value })}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
              
              <div className="mb-4">
                <label className="form-label">Closing Reading</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.closingReading}
                  onChange={(e) => setFormData({ ...formData, closingReading: e.target.value })}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
              
              <div className="mb-4">
                <label className="form-label">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="form-input"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="credit">Credit</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSaleModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Record Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}