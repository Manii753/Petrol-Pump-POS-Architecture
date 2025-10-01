'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { pumpsAPI, tanksAPI } from '@/lib/api';

export default function Pumps() {
  const { user } = useAuth();
  const [pumps, setPumps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPump, setEditingPump] = useState(null);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [formData, setFormData] = useState({
    pumpNumber: '',
    name: '',
    nozzles: [{ nozzleNumber: 'N1', fuelTypeId: '' }, { nozzleNumber: 'N2', fuelTypeId: '' }]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pumpsResponse, tanksResponse] = await Promise.all([
        pumpsAPI.getPumps(),
        tanksAPI.getTanks()
      ]);
      
      setPumps(pumpsResponse.data);
      setFuelTypes(tanksResponse.data.map(tank => tank.fuelTypeId));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        nozzles: formData.nozzles.filter(n => n.fuelTypeId)
      };

      if (editingPump) {
        await pumpsAPI.updatePump(editingPump._id, data);
      } else {
        await pumpsAPI.createPump(data);
      }
      
      setShowModal(false);
      setFormData({
        pumpNumber: '',
        name: '',
        nozzles: [{ nozzleNumber: 'N1', fuelTypeId: '' }, { nozzleNumber: 'N2', fuelTypeId: '' }]
      });
      setEditingPump(null);
      loadData();
    } catch (error) {
      console.error('Failed to save pump:', error);
    }
  };

  const handleEdit = (pump) => {
    setEditingPump(pump);
    setFormData({
      pumpNumber: pump.pumpNumber,
      name: pump.name,
      nozzles: pump.nozzles.length > 0 ? pump.nozzles : [{ nozzleNumber: 'N1', fuelTypeId: '' }, { nozzleNumber: 'N2', fuelTypeId: '' }]
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this pump?')) {
      try {
        await pumpsAPI.deletePump(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete pump:', error);
      }
    }
  };

  const addNozzle = () => {
    setFormData({
      ...formData,
      nozzles: [...formData.nozzles, { nozzleNumber: `N${formData.nozzles.length + 1}`, fuelTypeId: '' }]
    });
  };

  const removeNozzle = (index) => {
    setFormData({
      ...formData,
      nozzles: formData.nozzles.filter((_, i) => i !== index)
    });
  };

  const updateNozzle = (index, field, value) => {
    const updatedNozzles = [...formData.nozzles];
    updatedNozzles[index][field] = value;
    setFormData({ ...formData, nozzles: updatedNozzles });
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
            <h1 className="text-2xl font-bold text-secondary-900">Pumps</h1>
            <p className="text-secondary-600 mt-1">
              Manage fuel pumps and nozzles configuration
            </p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              Add New Pump
            </button>
          )}
        </div>

        {/* Pumps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pumps.map((pump) => (
            <div key={pump._id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-secondary-900">
                    {pump.pumpNumber} - {pump.name}
                  </h3>
                  <p className="text-sm text-secondary-600">
                    {pump.nozzles.length} nozzle{pump.nozzles.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {user?.role === 'admin' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(pump)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(pump._id)}
                      className="text-danger-600 hover:text-danger-900"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-secondary-700">Nozzles:</h4>
                {pump.nozzles.map((nozzle) => (
                  <div key={nozzle._id} className="flex justify-between items-center text-sm">
                    <span className="text-secondary-600">{nozzle.nozzleNumber}</span>
                    <span className="text-secondary-900 font-medium">
                      {nozzle.fuelTypeId?.name || 'Unknown'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {pumps.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-secondary-900">No pumps configured</h3>
            <p className="mt-1 text-sm text-secondary-500">
              {user?.role === 'admin' 
                ? 'Get started by adding a new pump.' 
                : 'Contact your administrator to configure pumps.'}
            </p>
          </div>
        )}
      </div>

      {/* Pump Modal */}
      {showModal && user?.role === 'admin' && (
        <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">
              {editingPump ? 'Edit Pump' : 'Add New Pump'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label">Pump Number</label>
                <input
                  type="text"
                  required
                  value={formData.pumpNumber}
                  onChange={(e) => setFormData({ ...formData, pumpNumber: e.target.value })}
                  className="form-input"
                  placeholder="e.g., P1"
                />
              </div>
              
              <div className="mb-4">
                <label className="form-label">Pump Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Pump 1"
                />
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="form-label">Nozzles</label>
                  <button
                    type="button"
                    onClick={addNozzle}
                    className="text-sm text-primary-600 hover:text-primary-900"
                  >
                    + Add Nozzle
                  </button>
                </div>
                {formData.nozzles.map((nozzle, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={nozzle.nozzleNumber}
                      onChange={(e) => updateNozzle(index, 'nozzleNumber', e.target.value)}
                      className="form-input flex-1"
                      placeholder="Nozzle Number"
                    />
                    <select
                      value={nozzle.fuelTypeId}
                      onChange={(e) => updateNozzle(index, 'fuelTypeId', e.target.value)}
                      className="form-input flex-1"
                    >
                      <option value="">Select Fuel Type</option>
                      {fuelTypes.map((fuelType) => (
                        <option key={fuelType._id} value={fuelType._id}>
                          {fuelType.name}
                        </option>
                      ))}
                    </select>
                    {formData.nozzles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeNozzle(index)}
                        className="text-danger-600 hover:text-danger-900 p-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPump(null);
                    setFormData({
                      pumpNumber: '',
                      name: '',
                      nozzles: [{ nozzleNumber: 'N1', fuelTypeId: '' }, { nozzleNumber: 'N2', fuelTypeId: '' }]
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingPump ? 'Update Pump' : 'Add Pump'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}