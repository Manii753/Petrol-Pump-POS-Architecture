'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { salesAPI, shiftsAPI, pumpsAPI } from '@/lib/api';
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertTriangle } from 'lucide-react';

export default function Sales() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [pumps, setPumps] = useState([]);
  const [currentShift, setCurrentShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [formData, setFormData] = useState({
    nozzleId: '',
    openingReading: '',
    closingReading: '',
    paymentMethod: 'cash'
  });
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [salesResponse, pumpsResponse] = await Promise.all([
        salesAPI.getSales(),
        pumpsAPI.getPumps()
      ]);
      
      setSales(salesResponse.data);
      setPumps(pumpsResponse.data);

      try {
        const shiftResponse = await shiftsAPI.getCurrentShift();
        setCurrentShift(shiftResponse.data);
      } catch (error) {
        // No open shift
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSale = async (e) => {
    e.preventDefault();
    try {
      await salesAPI.createSale({
        nozzleId: formData.nozzleId,
        openingReading: parseFloat(formData.openingReading),
        closingReading: parseFloat(formData.closingReading),
        paymentMethod: formData.paymentMethod
      });
      
      setShowSaleModal(false);
      setFormData({
        nozzleId: '',
        openingReading: '',
        closingReading: '',
        paymentMethod: 'cash'
      });
      
      loadData();
    } catch (error) {
      console.error('Failed to create sale:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR'
    }).format(amount);
  };

  const filteredSales = sales.filter(sale => 
    activeTab === 'all' || sale.paymentMethod === activeTab
  );

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
            <h1 className="text-2xl font-bold">Sales</h1>
            <p className="text-muted-foreground mt-1">
              Record and view fuel sales transactions
            </p>
          </div>
          {currentShift && (
            <Dialog open={showSaleModal} onOpenChange={setShowSaleModal}>
              <DialogTrigger asChild>
                <Button>Record Sale</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Record Fuel Sale</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSale}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="nozzleId" className="text-right">
                        Pump & Nozzle
                      </Label>
                      <Select
                        required
                        onValueChange={(value) => setFormData({ ...formData, nozzleId: value })}
                        value={formData.nozzleId}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select pump and nozzle" />
                        </SelectTrigger>
                        <SelectContent>
                          {pumps.map((pump) => 
                            pump.nozzles.map((nozzle) => (
                              <SelectItem key={nozzle._id} value={nozzle._id}>
                                {pump.pumpNumber} - {nozzle.nozzleNumber} ({nozzle.fuelTypeId?.name})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="openingReading" className="text-right">
                        Opening Reading
                      </Label>
                      <Input
                        id="openingReading"
                        type="number"
                        step="0.01"
                        required
                        value={formData.openingReading}
                        onChange={(e) => setFormData({ ...formData, openingReading: e.target.value })}
                        className="col-span-3"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="closingReading" className="text-right">
                        Closing Reading
                      </Label>
                      <Input
                        id="closingReading"
                        type="number"
                        step="0.01"
                        required
                        value={formData.closingReading}
                        onChange={(e) => setFormData({ ...formData, closingReading: e.target.value })}
                        className="col-span-3"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="paymentMethod" className="text-right">
                        Payment Method
                      </Label>
                      <Select
                        onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                        defaultValue={formData.paymentMethod}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="credit">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Record Sale</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!currentShift && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Active Shift</AlertTitle>
            <AlertDescription>
              You need to start a shift before you can record sales.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Sales</TabsTrigger>
            <TabsTrigger value="cash">Cash</TabsTrigger>
            <TabsTrigger value="card">Card</TabsTrigger>
            <TabsTrigger value="credit">Credit</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab}>
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Pump</TableHead>
                      <TableHead>Fuel Type</TableHead>
                      <TableHead className="text-right">Opening</TableHead>
                      <TableHead className="text-right">Closing</TableHead>
                      <TableHead className="text-right">Litres</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale._id}>
                        <TableCell>
                          {new Date(sale.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {sale.nozzleId?.pumpId?.pumpNumber || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {sale.nozzleId?.fuelTypeId?.name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-right">
                          {sale.openingReading.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {sale.closingReading.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {sale.litresDispensed.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(sale.pricePerLitre)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(sale.totalAmount)}
                        </TableCell>
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
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}