'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { pumpsAPI, tanksAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MoreHorizontal, Pencil, Trash2, PlusCircle } from 'lucide-react';

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
    nozzles: [{ nozzleNumber: 'N1', fuelTypeId: '' }]
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
      // Get unique fuel types
      const uniqueFuelTypes = Array.from(new Map(tanksResponse.data.map(tank => [tank.fuelTypeId?._id, tank.fuelTypeId])).values());
      setFuelTypes(uniqueFuelTypes.filter(Boolean));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      pumpNumber: '',
      name: '',
      nozzles: [{ nozzleNumber: 'N1', fuelTypeId: '' }]
    });
    setEditingPump(null);
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
      resetForm();
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
      nozzles: pump.nozzles.length > 0 ? pump.nozzles.map(n => ({...n, fuelTypeId: n.fuelTypeId?._id})) : [{ nozzleNumber: 'N1', fuelTypeId: '' }]
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
            <h1 className="text-2xl font-bold">Pumps</h1>
            <p className="text-muted-foreground mt-1">
              Manage fuel pumps and nozzles configuration
            </p>
          </div>
          {user?.role === 'admin' && (
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>Add New Pump</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{editingPump ? 'Edit Pump' : 'Add New Pump'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="pumpNumber" className="text-right">
                        Pump Number
                      </Label>
                      <Input
                        id="pumpNumber"
                        required
                        value={formData.pumpNumber}
                        onChange={(e) => setFormData({ ...formData, pumpNumber: e.target.value })}
                        className="col-span-3"
                        placeholder="e.g., P1"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Pump Name
                      </Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="col-span-3"
                        placeholder="e.g., Pump 1"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2">Nozzles</Label>
                      <div className="col-span-3 space-y-2">
                        {formData.nozzles.map((nozzle, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              type="text"
                              value={nozzle.nozzleNumber}
                              onChange={(e) => updateNozzle(index, 'nozzleNumber', e.target.value)}
                              className="flex-1"
                              placeholder="Nozzle Number"
                            />
                            <Select
                              value={nozzle.fuelTypeId}
                              onValueChange={(value) => updateNozzle(index, 'fuelTypeId', value)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select Fuel" />
                              </SelectTrigger>
                              <SelectContent>
                                {fuelTypes.map((fuelType) => (
                                  <SelectItem key={fuelType._id} value={fuelType._id}>
                                    {fuelType.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {formData.nozzles.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeNozzle(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addNozzle}
                          className="mt-2"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Nozzle
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button type="submit">{editingPump ? 'Update Pump' : 'Add Pump'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {pumps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pumps.map((pump) => (
              <Card key={pump._id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{pump.pumpNumber} - {pump.name}</CardTitle>
                  {user?.role === 'admin' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(pump)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(pump._id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {pump.nozzles.length} nozzle{pump.nozzles.length !== 1 ? 's' : ''}
                  </p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Nozzles:</h4>
                    {pump.nozzles.map((nozzle) => (
                      <div key={nozzle._id} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{nozzle.nozzleNumber}</span>
                        <span className="font-medium">
                          {nozzle.fuelTypeId?.name || 'Unknown'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="mt-2 text-lg font-semibold">No pumps configured</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {user?.role === 'admin' 
                ? 'Get started by adding a new pump.' 
                : 'Contact your administrator to configure pumps.'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}