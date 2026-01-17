"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { diveGroupService, GenerateInvoiceRequest } from "@/lib/api/services/dive-group.service";
import { bookingService, Booking } from "@/lib/api/services/booking.service";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface BillAgentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: number;
    onSuccess?: () => void;
}

export function BillAgentDialog({
    open,
    onOpenChange,
    groupId,
    onSuccess,
}: BillAgentDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [invoiceType, setInvoiceType] = useState<'single' | 'separate'>('single');
    const [invoiceTypeDetail, setInvoiceTypeDetail] = useState<'Advance' | 'Final' | 'Full'>('Full');
    const [includeDives, setIncludeDives] = useState(true);
    const [includeEquipment, setIncludeEquipment] = useState(true);
    const [taxPercentage, setTaxPercentage] = useState<number>(0);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [selectedBookingIds, setSelectedBookingIds] = useState<Set<number>>(new Set());
    const [loadingBookings, setLoadingBookings] = useState(true);

    useEffect(() => {
        if (open) {
            fetchBookings();
        }
    }, [open, groupId]);

    const fetchBookings = async () => {
        setLoadingBookings(true);
        try {
            const group = await diveGroupService.getById(groupId);
            if (group.members && group.members.length > 0) {
                const customerIds = group.members.map(m => m.id);
                // Fetch all bookings and filter by customer IDs
                const response = await bookingService.getAll();
                const allBookings = Array.isArray(response) ? response : (response as any).data || [];
                const groupBookings = allBookings.filter((b: Booking) => 
                    b.customer_id && customerIds.includes(b.customer_id)
                );
                setBookings(groupBookings);
                // Select all by default
                setSelectedBookingIds(new Set(groupBookings.map((b: Booking) => b.id)));
            }
        } catch (error) {
            console.error("Failed to fetch bookings", error);
        } finally {
            setLoadingBookings(false);
        }
    };

    const handleToggleBooking = (bookingId: number) => {
        setSelectedBookingIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(bookingId)) {
                newSet.delete(bookingId);
            } else {
                newSet.add(bookingId);
            }
            return newSet;
        });
    };

    const handleGenerate = async () => {
        if (selectedBookingIds.size === 0) {
            alert("Please select at least one booking");
            return;
        }

        setLoading(true);
        try {
            const request: GenerateInvoiceRequest = {
                invoice_type: invoiceType,
                booking_ids: Array.from(selectedBookingIds),
                invoice_type_detail: invoiceTypeDetail,
                include_dives: includeDives,
                include_equipment: includeEquipment,
                tax_percentage: taxPercentage || undefined,
            };

            const result = await diveGroupService.generateInvoice(groupId, request);
            
            if (onSuccess) {
                onSuccess();
            }
            
            onOpenChange(false);
            
            // Navigate to first invoice
            if (result.invoices && result.invoices.length > 0) {
                router.push(`/dashboard/invoices/${result.invoices[0].id}`);
            }
            
            router.refresh();
        } catch (error: any) {
            console.error("Failed to generate invoice", error);
            const errorMessage = error?.response?.data?.message || "Failed to generate invoice";
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Generate Invoice for Agent</DialogTitle>
                    <DialogDescription>
                        Create invoice(s) for the agent covering group bookings.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Invoice Type */}
                    <div className="space-y-3">
                        <Label>Invoice Structure</Label>
                        <RadioGroup value={invoiceType} onValueChange={(value) => setInvoiceType(value as any)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="single" id="single" />
                                <Label htmlFor="single">Single Invoice (all bookings combined)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="separate" id="separate" />
                                <Label htmlFor="separate">Separate Invoices (one per booking)</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Invoice Type Detail */}
                    <div className="space-y-3">
                        <Label>Invoice Type</Label>
                        <RadioGroup value={invoiceTypeDetail} onValueChange={(value) => setInvoiceTypeDetail(value as any)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Full" id="full" />
                                <Label htmlFor="full">Full Invoice</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Advance" id="advance" />
                                <Label htmlFor="advance">Advance Payment</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Final" id="final" />
                                <Label htmlFor="final">Final Invoice</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Include Items */}
                    <div className="space-y-3">
                        <Label>Include Items</Label>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="include-dives"
                                    checked={includeDives}
                                    onCheckedChange={(checked) => setIncludeDives(checked as boolean)}
                                />
                                <Label htmlFor="include-dives">Include Completed Dives</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="include-equipment"
                                    checked={includeEquipment}
                                    onCheckedChange={(checked) => setIncludeEquipment(checked as boolean)}
                                />
                                <Label htmlFor="include-equipment">Include Equipment Rentals</Label>
                            </div>
                        </div>
                    </div>

                    {/* Tax Percentage */}
                    <div className="space-y-2">
                        <Label htmlFor="tax">Tax Percentage (%)</Label>
                        <Input
                            id="tax"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={taxPercentage}
                            onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                        />
                    </div>

                    {/* Select Bookings */}
                    {loadingBookings ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                    ) : bookings.length > 0 ? (
                        <div className="space-y-3">
                            <Label>Select Bookings to Include</Label>
                            <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                                {bookings.map((booking) => (
                                    <div key={booking.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`booking-${booking.id}`}
                                            checked={selectedBookingIds.has(booking.id)}
                                            onCheckedChange={() => handleToggleBooking(booking.id)}
                                        />
                                        <Label htmlFor={`booking-${booking.id}`} className="flex-1 cursor-pointer">
                                            Booking #{booking.id} - {booking.customer?.full_name || 'Unknown'} 
                                            {booking.booking_date && ` - ${new Date(booking.booking_date).toLocaleDateString()}`}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-muted-foreground">
                            No bookings found for group members
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleGenerate} disabled={loading || selectedBookingIds.size === 0}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            "Generate Invoice"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

