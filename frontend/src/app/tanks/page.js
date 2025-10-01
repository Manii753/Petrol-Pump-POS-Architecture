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
import { Loader2, Pencil, AlertTriangle, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

export default function Tanks() {
  const { user } = useAuth();
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTankModal, setShowTankModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [allDeliveries, setAllDeliveries] = useState([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [tankToDelete, setTankToDelete] = useState(null);
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
      
      const deliveriesResponse = await tanksAPI.getAllDeliveries();
      setAllDeliveries(deliveriesResponse.data);

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

  const handleDeleteTank = async () => {
    try {
      await tanksAPI.deleteTank(tankToDelete._id);
      loadData();
      setShowDeleteConfirmModal(false);
      setTankToDelete(null);
    } catch (error) {
      console.error('Failed to delete tank:', error);
      // TODO: Show error message to user
    }
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
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tankNumber" className="text-right">Tank Number</Label>
                        <Input
                          id="tankNumber"
                          value={tankFormData.tankNumber}
                          onChange={(e) => setTankFormData({ ...tankFormData, tankNumber: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fuelType" className="text-right">Fuel Type</Label>
                        <Select
                          value={tankFormData.fuelTypeId}
                          onValueChange={(value) => setTankFormData({ ...tankFormData, fuelTypeId: value })}
                          required
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a fuel type" />
                          </SelectTrigger>
                          <SelectContent>
                            {fuelTypes.map((type) => (
                              <SelectItem key={type._id} value={type._id}>{type.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="capacityLitres" className="text-right">Capacity (Litres)</Label>
                        <Input
                          id="capacityLitres"
                          type="number"
                          value={tankFormData.capacityLitres}
                          onChange={(e) => setTankFormData({ ...tankFormData, capacityLitres: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="currentStock" className="text-right">Current Stock (Litres)</Label>
                        <Input
                          id="currentStock"
                          type="number"
                          value={tankFormData.currentStock}
                          onChange={(e) => setTankFormData({ ...tankFormData, currentStock: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="reorderLevel" className="text-right">Reorder Level (Litres)</Label>
                        <Input
                          id="reorderLevel"
                          type="number"
                          value={tankFormData.reorderLevel}
                          onChange={(e) => setTankFormData({ ...tankFormData, reorderLevel: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
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
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="tankId" className="text-right">Tank</Label>
                      <Select
                        value={deliveryFormData.tankId}
                        onValueChange={(value) => setDeliveryFormData({ ...deliveryFormData, tankId: value })}
                        required
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a tank" />
                        </SelectTrigger>
                        <SelectContent>
                          {tanks.map((tank) => (
                            <SelectItem key={tank._id} value={tank._id}>{tank.tankNumber} ({tank.fuelTypeId?.name})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="challanNumber" className="text-right">Challan Number</Label>
                      <Input
                        id="challanNumber"
                        value={deliveryFormData.challanNumber}
                        onChange={(e) => setDeliveryFormData({ ...deliveryFormData, challanNumber: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="litresDelivered" className="text-right">Litres Delivered</Label>
                      <Input
                        id="litresDelivered"
                        type="number"
                        value={deliveryFormData.litresDelivered}
                        onChange={(e) => setDeliveryFormData({ ...deliveryFormData, litresDelivered: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="deliveryDate" className="text-right">Delivery Date</Label>
                      <Input
                        id="deliveryDate"
                        type="date"
                        value={deliveryFormData.deliveryDate}
                        onChange={(e) => setDeliveryFormData({ ...deliveryFormData, deliveryDate: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="supplierName" className="text-right">Supplier Name</Label>
                      <Input
                        id="supplierName"
                        value={deliveryFormData.supplierName}
                        onChange={(e) => setDeliveryFormData({ ...deliveryFormData, supplierName: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="notes" className="text-right">Notes</Label>
                      <Textarea
                        id="notes"
                        value={deliveryFormData.notes}
                        onChange={(e) => setDeliveryFormData({ ...deliveryFormData, notes: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
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
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(tank)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setTankToDelete(tank);
                            setShowDeleteConfirmModal(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the tank 
                <strong>{tankToDelete?.tankNumber}</strong> and remove its data from our servers.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirmModal(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteTank}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Delivery History</h2>
          {allDeliveries.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tank Number</TableHead>
                    <TableHead>Challan No.</TableHead>
                    <TableHead>Litres</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allDeliveries.map((delivery) => (
                    <TableRow key={delivery._id}>
                      <TableCell>{delivery.tankId?.tankNumber || 'N/A'}</TableCell>
                      <TableCell>{delivery.challanNumber}</TableCell>
                      <TableCell>{delivery.litresDelivered}</TableCell>
                      <TableCell>{new Date(delivery.deliveryDate).toLocaleDateString()}</TableCell>
                      <TableCell>{delivery.supplierName}</TableCell>
                      <TableCell>{delivery.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center py-4">No delivery history recorded yet.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}