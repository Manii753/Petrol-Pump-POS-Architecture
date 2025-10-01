'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { shiftsAPI } from '@/lib/api';

export default function Shifts() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [formData, setFormData] = useState({
    openingCash: '',
    closingCash: '',
    notes: ''
  });

  useEffect(() => {
    loadShifts();
    checkCurrentShift();
  }, []);

  const loadShifts = async () => {
    try {
      const response = await shiftsAPI.getShifts();
      setShifts(response.data);
    } catch (error) {
      console.error('Failed to load shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentShift = async () => {
    try {
      const response = await shiftsAPI.getCurrentShift();
      setCurrentShift(response.data);
    } catch (error) {
      // No open shift
    }
  };

  const handleStartShift = async (e) => {
    e.preventDefault();
    try {
      await shiftsAPI.startShift({
        openingCash: parseFloat(formData.openingCash) || 0
      });
      setShowStartModal(false);
      setFormData({ openingCash: '', closingCash: '', notes: '' });
      loadShifts();
      checkCurrentShift();
    } catch (error) {
      console.error('Failed to start shift:', error);
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    try {
      await shiftsAPI.closeShift(currentShift._id, {
        closingCash: parseFloat(formData.closingCash) || 0,
        notes: formData.notes
      });
      setShowCloseModal(false);
      setFormData({ openingCash: '', closingCash: '', notes: '' });
      setCurrentShift(null);
      loadShifts();
    } catch (error) {
      console.error('Failed to close shift:', error);
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
            <h1 className="text-2xl font-bold text-secondary-900">Shifts</h1>
            <p className="text-secondary-600 mt-1">
              Manage your work shifts and view shift history
            </p>
          </div>
          <div className="space-x-3">
            {!currentShift ? (
              <button
                onClick={() => setShowStartModal(true)}
                className="btn-primary"
              >
                Start New Shift
              </button>
            ) : (
              <button
                onClick={() => setShowCloseModal(true)}
                className="btn-warning"
              >
                Close Current Shift
              </button>
            )}
          </div>
        </div>

        {/* Current Shift Status */}
        {currentShift && (
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-secondary-900">Current Shift</h3>
                <p className="text-sm text-secondary-600">
                  Started: {new Date(currentShift.startTime).toLocaleString()}
                </p>
                <p className="text-sm text-secondary-600">
                  Opening Cash: {formatCurrency(currentShift.openingCash)}
                </p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shifts Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Date</th>
                  <th className="table-header-cell">Attendant</th>
                  <th className="table-header-cell">Start Time</th>
                  <th className="table-header-cell">End Time</th>
                  <th className="table-header-cell">Opening Cash</th>
                  <th className="table-header-cell">Closing Cash</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {shifts.map((shift) => (
                  <tr key={shift._id}>
                    <td className="table-body-cell">
                      {new Date(shift.shiftDate).toLocaleDateString()}
                    </td>
                    <td className="table-body-cell">
                      {shift.userId?.fullName || 'Unknown'}
                    </td>
                    <td className="table-body-cell">
                      {new Date(shift.startTime).toLocaleTimeString()}
                    </td>
                    <td className="table-body-cell">
                      {shift.endTime ? new Date(shift.endTime).toLocaleTimeString() : '-'}
                    </td>
                    <td className="table-body-cell">
                      {formatCurrency(shift.openingCash)}
                    </td>
                    <td className="table-body-cell">
                      {shift.closingCash ? formatCurrency(shift.closingCash) : '-'}
                    </td>
                    <td className="table-body-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        shift.status === 'open' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-secondary-100 text-secondary-800'
                      }`}>
                        {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
                      </span>
                    </td>
                    <td className="table-body-cell">
                      <Link
                        href={`/shifts/${shift._id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Start Shift Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">Start New Shift</h3>
            <form onSubmit={handleStartShift}>
              <div className="mb-4">
                <label className="form-label">Opening Cash</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.openingCash}
                  onChange={(e) => setFormData({ ...formData, openingCash: e.target.value })}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Start Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseModal && currentShift && (
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">Close Current Shift</h3>
            <form onSubmit={handleCloseShift}>
              <div className="mb-4">
                <label className="form-label">Closing Cash</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.closingCash}
                  onChange={(e) => setFormData({ ...formData, closingCash: e.target.value })}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
              <div className="mb-4">
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="form-input"
                  rows={3}
                  placeholder="Any notes about this shift..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-warning">
                  Close Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}