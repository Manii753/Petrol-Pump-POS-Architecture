'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { tanksAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Pencil, AlertTriangle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

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
      
      const uniqueFuelTypes = [...new Map(tanksResponse.data.map(tank => 
        [tank.fuelTypeId?._id, tank.fuelTypeId]
      )).values()].filter(Boolean);
      setFuelTypes(uniqueFuelTypes);
    } catch (error) {
      console.error('Failed to load tanks:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetTankForm = () => {
    setEditingTank(null);
    setTankFormData({
      tankNumber: '',
      fuelTypeId: '',
      capacityLitres: '',
      currentStock: '',
      reorderLevel: ''
    });
  }

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
      resetTankForm();
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
    if (!tank.capacityLitres || tank.capacityLitres === 0) return 0;
    return (tank.currentStock / tank.capacityLitres) * 100;
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
            <h1 className="text-2xl font-bold">Tanks</h1>
            <p className="text-muted-foreground mt-1">
              Monitor fuel tank inventory and record deliveries
            </p>
          </div>
          <div className="space-x-3">
            {user?.role === 'admin' && (
              <Dialog open={showTankModal} onOpenChange={setShowTankModal}>
                <DialogTrigger asChild>
                  <Button onClick={resetTankForm}>Add Tank</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{editingTank ? 'Edit Tank' : 'Add New Tank'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleTankSubmit}>
                    <div className="grid gap-4 py-4">
                      {/* Form fields */}
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowTankModal(false)}>Cancel</Button>
                      <Button type="submit">{editingTank ? 'Update Tank' : 'Add Tank'}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
              <DialogTrigger asChild>
                <Button variant="secondary">Record Delivery</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Record Fuel Delivery</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleDeliverySubmit}>
                  <div className="grid gap-4 py-4">
                    {/* Form fields */}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowDeliveryModal(false)}>Cancel</Button>
                    <Button type="submit">Record Delivery</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {tanks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tanks.map((tank) => (
              <Card key={tank._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{tank.tankNumber}</CardTitle>
                      <CardDescription>{tank.fuelTypeId?.name || 'Unknown'}</CardDescription>
                    </div>
                    {user?.role === 'admin' && (
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(tank)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Current Stock</span>
                      <span className="font-medium">{tank.currentStock.toFixed(0)} L</span>
                    </div>
                    <Progress value={getStockPercentage(tank)} />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0 L</span>
                      <span>{tank.capacityLitres} L</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Capacity:</span>
                      <div className="font-medium">{tank.capacityLitres} L</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reorder Level:</span>
                      <div className="font-medium">{tank.reorderLevel} L</div>
                    </div>
                  </div>
                  {tank.currentStock <= tank.reorderLevel && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Low Stock</AlertTitle>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="mt-2 text-lg font-semibold">No tanks configured</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {user?.role === 'admin' 
                ? 'Get started by adding a new tank.' 
                : 'Contact your administrator to configure tanks.'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}