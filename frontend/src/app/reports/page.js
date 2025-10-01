'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { reportsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Fuel, Wallet, CalendarDays, CreditCard, FileText } from 'lucide-react';

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

  const handleExportPDF = async () => {
    try {
      let response;
      let filename;

      if (reportType === 'daily') {
        response = await reportsAPI.exportDailySalesReportPDF({ date: selectedDate });
        filename = `daily-sales-report-${selectedDate}.pdf`;
      } else if (reportType === 'monthly') {
        response = await reportsAPI.exportMonthlySalesReportPDF({ year: selectedYear, month: selectedMonth });
        filename = `monthly-sales-report-${selectedYear}-${selectedMonth.toString().padStart(2, '0')}.pdf`;
      }

      if (response) {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export sales report PDF:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate and view sales reports
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="reportType">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger id="reportType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Sales Report</SelectItem>
                    <SelectItem value="monthly">Monthly Sales Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reportType === 'daily' && (
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              )}

              {reportType === 'monthly' && (
                <>
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      min="2020"
                      max="2030"
                    />
                  </div>
                  <div>
                    <Label htmlFor="month">Month</Label>
                    <Select
                      value={selectedMonth.toString()}
                      onValueChange={(val) => setSelectedMonth(parseInt(val))}
                    >
                      <SelectTrigger id="month">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            <Button onClick={generateReport} disabled={loading} className="mr-2">
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                'Generate Report'
              )}
            </Button>
            {reportData && (
              <Button onClick={handleExportPDF} variant="outline" disabled={loading}>
                <FileText className="mr-2 h-4 w-4" /> Download PDF
              </Button>
            )}
          </CardContent>
        </Card>

        {reportData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.summary?.totalSales || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Litres</CardTitle>
                  <Fuel className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.summary?.totalLitres?.toFixed(2) || 0} L</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(reportData.summary?.totalAmount || 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{reportType === 'daily' ? 'Shifts' : 'Days'}</CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.summary?.totalShifts || reportData.summary?.totalDays || 0}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center space-x-4">
                        <Wallet className="h-8 w-8 text-green-500" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Cash Payments</p>
                            <p className="text-2xl font-semibold">
                            {formatCurrency(reportData.summary?.cashAmount || 0)}
                            </p>
                        </div>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center space-x-4">
                        <CreditCard className="h-8 w-8 text-blue-500" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Card Payments</p>
                            <p className="text-2xl font-semibold">
                            {formatCurrency(reportData.summary?.cardAmount || 0)}
                            </p>
                        </div>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center space-x-4">
                        <FileText className="h-8 w-8 text-purple-500" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Credit Payments</p>
                            <p className="text-2xl font-semibold">
                            {formatCurrency(reportData.summary?.creditAmount || 0)}
                            </p>
                        </div>
                    </CardHeader>
                </Card>
            </div>

            {reportData.summary?.salesByFuelType && Object.keys(reportData.summary.salesByFuelType).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Sales by Fuel Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fuel Type</TableHead>
                        <TableHead>Sales Count</TableHead>
                        <TableHead className="text-right">Total Litres</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(reportData.summary.salesByFuelType).map(([fuelType, data]) => (
                        <TableRow key={fuelType}>
                          <TableCell className="font-medium">{fuelType}</TableCell>
                          <TableCell>{data.count}</TableCell>
                          <TableCell className="text-right">{data.litres.toFixed(2)} L</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(data.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {reportData.summary?.salesByPump && Object.keys(reportData.summary.salesByPump).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Sales by Pump</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pump</TableHead>
                        <TableHead>Sales Count</TableHead>
                        <TableHead className="text-right">Total Litres</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(reportData.summary.salesByPump).map(([pump, data]) => (
                        <TableRow key={pump}>
                          <TableCell className="font-medium">{pump}</TableCell>
                          <TableCell>{data.count}</TableCell>
                          <TableCell className="text-right">{data.litres.toFixed(2)} L</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(data.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {reportData.sales && reportData.sales.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Sales</CardTitle>
                  <CardDescription>Showing first 20 of {reportData.sales.length} sales</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Pump</TableHead>
                        <TableHead>Fuel Type</TableHead>
                        <TableHead className="text-right">Litres</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Payment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.sales.slice(0, 20).map((sale) => (
                        <TableRow key={sale._id}>
                          <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                          <TableCell>{sale.nozzleId?.pumpId?.pumpNumber || 'Unknown'}</TableCell>
                          <TableCell>{sale.nozzleId?.fuelTypeId?.name || 'Unknown'}</TableCell>
                          <TableCell className="text-right">{sale.litresDispensed.toFixed(2)} L</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(sale.totalAmount)}</TableCell>
                          <TableCell>
                            <Badge variant={sale.paymentMethod === 'cash' ? 'secondary' : 'outline'}>
                              {sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}