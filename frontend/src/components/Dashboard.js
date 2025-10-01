'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from './Layout';
import { shiftsAPI, salesAPI, tanksAPI } from '@/lib/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todaySales: 0,
    todayLitres: 0,
    todayRevenue: 0,
    openShifts: 0,
    lowStockTanks: 0,
    totalCash: 0,
    totalCard: 0,
    totalCredit: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentShift, setCurrentShift] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's sales
      const salesResponse = await salesAPI.getSales({ date: today });
      const todaySales = salesResponse.data;

      // Get current shift
      try {
        const shiftResponse = await shiftsAPI.getCurrentShift();
        setCurrentShift(shiftResponse.data);
      } catch (error) {
        // No open shift
      }

      // Get tanks for stock status
      const tanksResponse = await tanksAPI.getTanks();
      const tanks = tanksResponse.data;
      const lowStockTanks = tanks.filter(tank => tank.currentStock <= tank.reorderLevel).length;

      // Calculate stats
      const totalLitres = todaySales.reduce((sum, sale) => sum + sale.litresDispensed, 0);
      const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const cashAmount = todaySales.filter(s => s.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.totalAmount, 0);
      const cardAmount = todaySales.filter(s => s.paymentMethod === 'card').reduce((sum, sale) => sum + sale.totalAmount, 0);
      const creditAmount = todaySales.filter(s => s.paymentMethod === 'credit').reduce((sum, sale) => sum + sale.totalAmount, 0);

      setStats({
        todaySales: todaySales.length,
        todayLitres: totalLitres,
        todayRevenue: totalRevenue,
        openShifts: currentShift ? 1 : 0,
        lowStockTanks,
        totalCash: cashAmount,
        totalCard: cardAmount,
        totalCredit: creditAmount
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-2xl font-bold text-secondary-900">
              Welcome back, {user?.fullName}
            </h1>
            <p className="text-secondary-600 mt-1">
              {user?.role === 'admin' ? 'System Administrator' : 
               user?.role === 'supervisor' ? 'Supervisor' : 'Pump Attendant'}
            </p>
          </div>
          <div className="text-sm text-secondary-500">
            {new Date().toLocaleDateString('en-PK', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today's Sales */}
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-secondary-500 truncate">
                    Today's Sales
                  </dt>
                  <dd className="text-lg font-medium text-secondary-900">
                    {stats.todaySales}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          {/* Today's Litres */}
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-secondary-500 truncate">
                    Litres Sold
                  </dt>
                  <dd className="text-lg font-medium text-secondary-900">
                    {stats.todayLitres.toFixed(2)} L
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          {/* Today's Revenue */}
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-secondary-500 truncate">
                    Today's Revenue
                  </dt>
                  <dd className="text-lg font-medium text-secondary-900">
                    PKR {stats.todayRevenue.toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          {/* Open Shifts */}
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-secondary-500 truncate">
                    Open Shifts
                  </dt>
                  <dd className="text-lg font-medium text-secondary-900">
                    {stats.openShifts}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Current Shift Status */}
        {currentShift && (
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-secondary-900">Current Shift</h3>
                <p className="text-sm text-secondary-600">
                  Started at {new Date(currentShift.startTime).toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-secondary-600">Opening Cash</p>
                <p className="text-lg font-medium text-secondary-900">
                  PKR {currentShift.openingCash.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Cash Payments</p>
                <p className="text-2xl font-semibold text-secondary-900">
                  PKR {stats.totalCash.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Card Payments</p>
                <p className="text-2xl font-semibold text-secondary-900">
                  PKR {stats.totalCard.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Credit Payments</p>
                <p className="text-2xl font-semibold text-secondary-900">
                  PKR {stats.totalCredit.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {stats.lowStockTanks > 0 && (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-warning-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-warning-800">
                  Low Stock Alert
                </h3>
                <div className="mt-2 text-sm text-warning-700">
                  <p>
                    {stats.lowStockTanks} tank{stats.lowStockTanks > 1 ? 's' : ''} ha{stats.lowStockTanks > 1 ? 've' : 's'} reached reorder level. 
                    Please check tank inventory and place orders if needed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}