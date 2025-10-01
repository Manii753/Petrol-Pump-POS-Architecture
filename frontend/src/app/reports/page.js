'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { reportsAPI } from '@/lib/api';

export default function Reports() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR'
    }).format(amount);
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let response;
      
      switch (reportType) {
        case 'daily':
          response = await reportsAPI.getDailySalesReport({ date: selectedDate });
          break;
        case 'monthly':
          response = await reportsAPI.getMonthlySalesReport({ 
            year: selectedYear, 
            month: selectedMonth 
          });
          break;
        default:
          return;
      }
      
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async (shiftId) => {
    try {
      const response = await reportsAPI.exportShiftPDF(shiftId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shift-report-${shiftId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Reports</h1>
          <p className="text-secondary-600 mt-1">
            Generate and view sales reports
          </p>
        </div>

        {/* Report Options */}
        <div className="card">
          <div className="space-y-4">
            <div>
              <label className="form-label">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="form-input"
              >
                <option value="daily">Daily Sales Report</option>
                <option value="monthly">Monthly Sales Report</option>
              </select>
            </div>

            {reportType === 'daily' && (
              <div>
                <label className="form-label">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="form-input"
                />
              </div>
            )}

            {reportType === 'monthly' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Year</label>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="form-input"
                    min="2020"
                    max="2030"
                  />
                </div>
                <div>
                  <label className="form-label">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="form-input"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              onClick={generateReport}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </div>
              ) : (
                'Generate Report'
              )}
            </button>
          </div>
        </div>

        {/* Report Display */}
        {reportData && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        Total Sales
                      </dt>
                      <dd className="text-lg font-medium text-secondary-900">
                        {reportData.summary?.totalSales || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

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
                        Total Litres
                      </dt>
                      <dd className="text-lg font-medium text-secondary-900">
                        {reportData.summary?.totalLitres?.toFixed(2) || 0} L
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

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
                        Total Revenue
                      </dt>
                      <dd className="text-lg font-medium text-secondary-900">
                        {formatCurrency(reportData.summary?.totalAmount || 0)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-secondary-500 truncate">
                        {reportType === 'daily' ? 'Shifts' : 'Days'}
                      </dt>
                      <dd className="text-lg font-medium text-secondary-900">
                        {reportData.summary?.totalShifts || reportData.summary?.totalDays || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Breakdown */}
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
                      {formatCurrency(reportData.summary?.cashAmount || 0)}
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
                      {formatCurrency(reportData.summary?.cardAmount || 0)}
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
                      {formatCurrency(reportData.summary?.creditAmount || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales by Fuel Type */}
            {reportData.summary?.salesByFuelType && Object.keys(reportData.summary.salesByFuelType).length > 0 && (
              <div className="card">
                <h3 className="text-lg font-medium text-secondary-900 mb-4">Sales by Fuel Type</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-secondary-200">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Fuel Type</th>
                        <th className="table-header-cell">Sales Count</th>
                        <th className="table-header-cell">Total Litres</th>
                        <th className="table-header-cell">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-secondary-200">
                      {Object.entries(reportData.summary.salesByFuelType).map(([fuelType, data]) => (
                        <tr key={fuelType}>
                          <td className="table-body-cell font-medium">{fuelType}</td>
                          <td className="table-body-cell">{data.count}</td>
                          <td className="table-body-cell">{data.litres.toFixed(2)} L</td>
                          <td className="table-body-cell font-medium">{formatCurrency(data.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sales by Pump */}
            {reportData.summary?.salesByPump && Object.keys(reportData.summary.salesByPump).length > 0 && (
              <div className="card">
                <h3 className="text-lg font-medium text-secondary-900 mb-4">Sales by Pump</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-secondary-200">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Pump</th>
                        <th className="table-header-cell">Sales Count</th>
                        <th className="table-header-cell">Total Litres</th>
                        <th className="table-header-cell">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-secondary-200">
                      {Object.entries(reportData.summary.salesByPump).map(([pump, data]) => (
                        <tr key={pump}>
                          <td className="table-body-cell font-medium">{pump}</td>
                          <td className="table-body-cell">{data.count}</td>
                          <td className="table-body-cell">{data.litres.toFixed(2)} L</td>
                          <td className="table-body-cell font-medium">{formatCurrency(data.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Detailed Sales */}
            {reportData.sales && reportData.sales.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-medium text-secondary-900 mb-4">Detailed Sales</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-secondary-200">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Date & Time</th>
                        <th className="table-header-cell">Pump</th>
                        <th className="table-header-cell">Fuel Type</th>
                        <th className="table-header-cell">Litres</th>
                        <th className="table-header-cell">Amount</th>
                        <th className="table-header-cell">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-secondary-200">
                      {reportData.sales.slice(0, 20).map((sale) => (
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
                            {sale.litresDispensed.toFixed(2)} L
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
                  {reportData.sales.length > 20 && (
                    <div className="text-center py-4 text-sm text-secondary-500">
                      Showing first 20 of {reportData.sales.length} sales
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}