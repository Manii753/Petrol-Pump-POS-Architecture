'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { shiftsAPI } from '@/lib/api';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Shifts() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [formData, setFormData] = useState({
    openingCash: '',
    closingCash: '',
    notes: ''
  });

  useEffect(() => {
    loadShifts();
    checkCurrentShift();
  }, []);

  const loadShifts = async () => {
    try {
      const response = await shiftsAPI.getShifts();
      setShifts(response.data);
    } catch (error) {
      console.error('Failed to load shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentShift = async () => {
    try {
      const response = await shiftsAPI.getCurrentShift();
      setCurrentShift(response.data);
    } catch (error) {
      // No open shift
    }
  };

  const handleStartShift = async (e) => {
    e.preventDefault();
    try {
      await shiftsAPI.startShift({
        openingCash: parseFloat(formData.openingCash) || 0
      });
      setShowStartModal(false);
      setFormData({ openingCash: '', closingCash: '', notes: '' });
      loadShifts();
      checkCurrentShift();
    } catch (error) {
      console.error('Failed to start shift:', error);
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    try {
      await shiftsAPI.closeShift(currentShift._id, {
        closingCash: parseFloat(formData.closingCash) || 0,
        notes: formData.notes
      });
      setShowCloseModal(false);
      setFormData({ openingCash: '', closingCash: '', notes: '' });
      setCurrentShift(null);
      loadShifts();
    } catch (error) {
      console.error('Failed to close shift:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR'
    }).format(amount);
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
            <h1 className="text-2xl font-bold">Shifts</h1>
            <p className="text-muted-foreground mt-1">
              Manage your work shifts and view shift history
            </p>
          </div>
          <div className="space-x-3">
            {!currentShift ? (
              <Dialog open={showStartModal} onOpenChange={setShowStartModal}>
                <DialogTrigger asChild>
                  <Button>Start New Shift</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Start New Shift</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleStartShift}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="openingCash" className="text-right">
                          Opening Cash
                        </Label>
                        <Input
                          id="openingCash"
                          type="number"
                          step="0.01"
                          required
                          value={formData.openingCash}
                          onChange={(e) => setFormData({ ...formData, openingCash: e.target.value })}
                          className="col-span-3"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Start Shift</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={showCloseModal} onOpenChange={setShowCloseModal}>
                <DialogTrigger asChild>
                  <Button variant="destructive">Close Current Shift</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Close Current Shift</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCloseShift}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="closingCash" className="text-right">
                          Closing Cash
                        </Label>
                        <Input
                          id="closingCash"
                          type="number"
                          step="0.01"
                          required
                          value={formData.closingCash}
                          onChange={(e) => setFormData({ ...formData, closingCash: e.target.value })}
                          className="col-span-3"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="notes" className="text-right">
                          Notes
                        </Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="col-span-3"
                          placeholder="Any notes about this shift..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" variant="destructive">Close Shift</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {currentShift && (
          <Card>
            <CardHeader>
              <CardTitle>Current Active Shift</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Started: {new Date(currentShift.startTime).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Opening Cash: {formatCurrency(currentShift.openingCash)}
                </p>
              </div>
              <Badge>Active</Badge>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Shift History</CardTitle>
            <CardDescription>A list of all past shifts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Attendant</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead className="text-right">Opening Cash</TableHead>
                  <TableHead className="text-right">Closing Cash</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift._id}>
                    <TableCell>
                      {new Date(shift.shiftDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{shift.userId?.fullName || 'Unknown'}</TableCell>
                    <TableCell>
                      {new Date(shift.startTime).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      {shift.endTime ? new Date(shift.endTime).toLocaleTimeString() : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(shift.openingCash)}
                    </TableCell>
                    <TableCell className="text-right">
                      {shift.closingCash ? formatCurrency(shift.closingCash) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={shift.status === 'open' ? 'default' : 'outline'}>
                        {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/shifts/${shift._id}`}>View Details</Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}