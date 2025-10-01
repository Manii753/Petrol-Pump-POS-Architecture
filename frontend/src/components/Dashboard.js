'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from './Layout';
import { shiftsAPI, salesAPI, tanksAPI } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  TrendingUp,
  Fuel,
  Clock,
  Wallet,
  CreditCard,
  FileText,
  AlertTriangle
} from 'lucide-react';

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
      
      const salesResponse = await salesAPI.getSales({ date: today });
      const todaySales = salesResponse.data;

      try {
        const shiftResponse = await shiftsAPI.getCurrentShift();
        setCurrentShift(shiftResponse.data);
      } catch (error) {
        // No open shift
      }

      const tanksResponse = await tanksAPI.getTanks();
      const tanks = tanksResponse.data;
      const lowStockTanks = tanks.filter(tank => tank.currentStock <= tank.reorderLevel).length;

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
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.fullName}
            </h1>
            <p className="text-muted-foreground mt-1">
              {user?.role === 'admin' ? 'System Administrator' : 
               user?.role === 'supervisor' ? 'Supervisor' : 'Pump Attendant'}
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-PK', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todaySales}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Litres Sold</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayLitres.toFixed(2)} L</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">PKR {stats.todayRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Shifts</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openShifts}</div>
            </CardContent>
          </Card>
        </div>

        {currentShift && (
          <Card>
            <CardHeader>
              <CardTitle>Current Shift</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  Started at {new Date(currentShift.startTime).toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Opening Cash</p>
                <p className="text-lg font-medium">
                  PKR {currentShift.openingCash.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center space-x-4">
              <Wallet className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cash Payments</p>
                <p className="text-2xl font-semibold">
                  PKR {stats.totalCash.toFixed(2)}
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
                  PKR {stats.totalCard.toFixed(2)}
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
                  PKR {stats.totalCredit.toFixed(2)}
                </p>
              </div>
            </CardHeader>
          </Card>
        </div>

        {stats.lowStockTanks > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Low Stock Alert</AlertTitle>
            <AlertDescription>
              {stats.lowStockTanks} tank{stats.lowStockTanks > 1 ? 's' : ''} ha{stats.lowStockTanks > 1 ? 've' : 's'} reached reorder level. 
              Please check tank inventory and place orders if needed.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Layout>
  );
}