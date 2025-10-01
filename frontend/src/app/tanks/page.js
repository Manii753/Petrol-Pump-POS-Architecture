'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { tanksAPI } from '@/lib/api';

export default function Tanks() {
  const { user } = useAuth();
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTankModal, setShowTankModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [editingTank, setEditingTank] = useState(null);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [tankFormData, setTankFormData] = useState({
    tankNumber: '',
    fuelTypeId: '',
    capacityLitres: '',
    currentStock: '',
    reorderLevel: ''
  });
  const [deliveryFormData, setDeliveryFormData] = useState({
    tankId: '',
    challanNumber: '',
    litresDelivered: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    supplierName: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const tanksResponse = await tanksAPI.getTanks();
      setTanks(tanksResponse.data);
      
      // Extract unique fuel types from tanks
      const uniqueFuelTypes = [...new Map(tanksResponse.data.map(tank => 
        [tank.fuelTypeId._id, tank.fuelTypeId]
      )).values()];
      setFuelTypes(uniqueFuelTypes);
    } catch (error) {
      console.error('Failed to load tanks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTankSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...tankFormData,
        capacityLitres: parseFloat(tankFormData.capacityLitres),
        currentStock: parseFloat(tankFormData.currentStock) || 0,
        reorderLevel: parseFloat(tankFormData.reorderLevel) || 0
      };

      if (editingTank) {
        await tanksAPI.updateTank(editingTank._id, data);
      } else {
        await tanksAPI.createTank(data);
      }
      
      setShowTankModal(false);
      setTankFormData({
        tankNumber: '',
        fuelTypeId: '',
        capacityLitres: '',
        currentStock: '',
        reorderLevel: ''
      });
      setEditingTank(null);
      loadData();
    } catch (error) {
      console.error('Failed to save tank:', error);
    }
  };

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    try {
      await tanksAPI.recordDelivery({
        ...deliveryFormData,
        litresDelivered: parseFloat(deliveryFormData.litresDelivered)
      });
      
      setShowDeliveryModal(false);
      setDeliveryFormData({
        tankId: '',
        challanNumber: '',
        litresDelivered: '',
        deliveryDate: new Date().toISOString().split('T')[0],
        supplierName: '',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Failed to record delivery:', error);
    }
  };

  const handleEdit = (tank) => {
    setEditingTank(tank);
    setTankFormData({
      tankNumber: tank.tankNumber,
      fuelTypeId: tank.fuelTypeId._id,
      capacityLitres: tank.capacityLitres.toString(),
      currentStock: tank.currentStock.toString(),
      reorderLevel: tank.reorderLevel.toString()
    });
    setShowTankModal(true);
  };

  const getStockPercentage = (tank) => {
    return (tank.currentStock / tank.capacityLitres) * 100;
  };

  const getStockColor = (tank) => {
    const percentage = getStockPercentage(tank);
    if (percentage <= 20 || tank.currentStock <= tank.reorderLevel) return 'bg-danger-500';
    if (percentage <= 40) return 'bg-warning-500';
    return 'bg-success-500';
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
            <h1 className="text-2xl font-bold text-secondary-900">Tanks</h1>
            <p className="text-secondary-600 mt-1">
              Monitor fuel tank inventory and record deliveries
            </p>
          </div>
          <div className="space-x-3">
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowTankModal(true)}
                className="btn-primary"
              >
                Add Tank
              </button>
            )}
            <button
              onClick={() => setShowDeliveryModal(true)}
              className="btn-secondary"
            >
              Record Delivery
            </button>
          </div>
        </div>

        {/* Tanks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tanks.map((tank) => (
            <div key={tank._id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-secondary-900">
                    {tank.tankNumber}
                  </h3>
                  <p className="text-sm text-secondary-600">
                    {tank.fuelTypeId?.name || 'Unknown Fuel Type'}
                  </p>
                </div>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleEdit(tank)}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-secondary-600">Current Stock</span>
                    <span className="font-medium text-secondary-900">
                      {tank.currentStock.toFixed(0)} L
                    </span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getStockColor(tank)}`}
                      style={{ width: `${Math.min(getStockPercentage(tank), 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-secondary-500 mt-1">
                    <span>0 L</span>
                    <span>{tank.capacityLitres} L</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-secondary-600">Capacity:</span>
                    <div className="font-medium">{tank.capacityLitres} L</div>
                  </div>
                  <div>
                    <span className="text-secondary-600">Reorder Level:</span>
                    <div className="font-medium">{tank.reorderLevel} L</div>
                  </div>
                </div>

                {tank.currentStock <= tank.reorderLevel && (
                  <div className="bg-warning-50 border border-warning-200 rounded-md p-2">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 text-warning-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-warning-800 font-medium">Low Stock</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {tanks.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-secondary-900">No tanks configured</h3>
            <p className="mt-1 text-sm text-secondary-500">
              {user?.role === 'admin' 
                ? 'Get started by adding a new tank.' 
                : 'Contact your administrator to configure tanks.'}
            </p>
          </div>
        )}
      </div>

      {/* Tank Modal */}
      {showTankModal && user?.role === 'admin' && (
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">
              {editingTank ? 'Edit Tank' : 'Add New Tank'}
            </h3>
            <form onSubmit={handleTankSubmit}>
              <div className="mb-4">
                <label className="form-label">Tank Number</label>
                <input
                  type="text"
                  required
                  value={tankFormData.tankNumber}
                  onChange={(e) => setTankFormData({ ...tankFormData, tankNumber: e.target.value })}
                  className="form-input"
                  placeholder="e.g., T1"
                />
              </div>
              
              <div className="mb-4">
                <label className="form-label">Fuel Type</label>
                <select
                  required
                  value={tankFormData.fuelTypeId}
                  onChange={(e) => setTankFormData({ ...tankFormData, fuelTypeId: e.target.value })}
                  className="form-input"
                >
                  <option value="">Select fuel type</option>
                  {fuelTypes.map((fuelType) => (
                    <option key={fuelType._id} value={fuelType._id}>
                      {fuelType.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="form-label">Capacity (Litres)</label>
                <input
                  type="number"
                  required
                  value={tankFormData.capacityLitres}
                  onChange={(e) => setTankFormData({ ...tankFormData, capacityLitres: e.target.value })}
                  className="form-input"
                  placeholder="10000"
                />
              </div>
              
              <div className="mb-4">
                <label className="form-label">Current Stock (Litres)</label>
                <input
                  type="number"
                  value={tankFormData.currentStock}
                  onChange={(e) => setTankFormData({ ...tankFormData, currentStock: e.target.value })}
                  className="form-input"
                  placeholder="0"
                />
              </div>
              
              <div className="mb-4">
                <label className="form-label">Reorder Level (Litres)</label>
                <input
                  type="number"
                  value={tankFormData.reorderLevel}
                  onChange={(e) => setTankFormData({ ...tankFormData, reorderLevel: e.target.value })}
                  className="form-input"
                  placeholder="2000"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowTankModal(false);
                    setEditingTank(null);
                    setTankFormData({
                      tankNumber: '',
                      fuelTypeId: '',
                      capacityLitres: '',
                      currentStock: '',
                      reorderLevel: ''
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTank ? 'Update Tank' : 'Add Tank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">Record Fuel Delivery</h3>
            <form onSubmit={handleDeliverySubmit}>
              <div className="mb-4">
                <label className="form-label">Tank</label>
                <select
                  required
                  value={deliveryFormData.tankId}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, tankId: e.target.value })}
                  className="form-input"
                >
                  <option value="">Select tank</option>
                  {tanks.map((tank) => (
                    <option key={tank._id} value={tank._id}>
                      {tank.tankNumber} - {tank.fuelTypeId?.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="form-label">Challan Number</label>
                <input
                  type="text"
                  required
                  value={deliveryFormData.challanNumber}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, challanNumber: e.target.value })}
                  className="form-input"
                  placeholder="Challan number"
                />
              </div>
              
              <div className="mb-4">
                <label className="form-label">Litres Delivered</label>
                <input
                  type="number"
                  required
                  value={deliveryFormData.litresDelivered}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, litresDelivered: e.target.value })}
                  className="form-input"
                  placeholder="0"
                />
              </div>
              
              <div className="mb-4">
                <label className="form-label">Delivery Date</label>
                <input
                  type="date"
                  required
                  value={deliveryFormData.deliveryDate}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, deliveryDate: e.target.value })}
                  className="form-input"
                />
              </div>
              
              <div className="mb-4">
                <label className="form-label">Supplier Name</label>
                <input
                  type="text"
                  value={deliveryFormData.supplierName}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, supplierName: e.target.value })}
                  className="form-input"
                  placeholder="Supplier name"
                />
              </div>
              
              <div className="mb-4">
                <label className="form-label">Notes</label>
                <textarea
                  value={deliveryFormData.notes}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, notes: e.target.value })}
                  className="form-input"
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Record Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}