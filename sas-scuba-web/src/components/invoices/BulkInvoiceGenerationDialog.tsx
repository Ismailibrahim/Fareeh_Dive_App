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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { invoiceService, GenerateBulkInvoiceRequest } from "@/lib/api/services/invoice.service";
import { bookingDiveService, BookingDive } from "@/lib/api/services/booking-dive.service";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BulkInvoiceGenerationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bookingIds: number[];
    onSuccess?: () => void;
}

export function BulkInvoiceGenerationDialog({
    open,
    onOpenChange,
    bookingIds,
    onSuccess,
}: BulkInvoiceGenerationDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [bookingsData, setBookingsData] = useState<any[]>([]);
    
    const [invoiceType, setInvoiceType] = useState<'Advance' | 'Final' | 'Full'>('Full');
    const [includeDives, setIncludeDives] = useState(true);
    const [includeEquipment, setIncludeEquipment] = useState(true);
    const [includeExcursions, setIncludeExcursions] = useState(true);
    const [taxPercentage, setTaxPercentage] = useState<number>(0);
    const [primaryCustomerId, setPrimaryCustomerId] = useState<string>("");

    useEffect(() => {
        if (open && bookingIds.length > 0) {
            fetchBookingsData();
        }
    }, [open, bookingIds]);

    const fetchBookingsData = async () => {
        setLoadingBookings(true);
        try {
            // We'll get unique customers from the selected bookings
            // Since we have bookingIds, we need to fetch their details
            // For now, let's use a simplified approach or fetch them
            const response = await bookingDiveService.getAll();
            const allDives = Array.isArray(response) ? response : (response as any).data || [];
            
            // Filter to get unique bookings among those selected
            const selectedBookings = allDives
                .filter((d: BookingDive) => bookingIds.includes(d.booking_id))
                .reduce((acc: any[], current: BookingDive) => {
                    if (!acc.find(b => b.id === current.booking_id)) {
                        acc.push({
                            id: current.booking_id,
                            customer: current.booking?.customer,
                            customer_id: current.booking?.customer_id
                        });
                    }
                    return acc;
                }, []);

            setBookingsData(selectedBookings);
            
            // Default primary customer to the first one
            if (selectedBookings.length > 0) {
                setPrimaryCustomerId(selectedBookings[0].customer_id.toString());
            }
        } catch (error) {
            console.error("Failed to fetch bookings data", error);
        } finally {
            setLoadingBookings(false);
        }
    };

    const handleGenerate = async () => {
        if (!primaryCustomerId) return;
        
        setLoading(true);
        try {
            const request: GenerateBulkInvoiceRequest = {
                booking_ids: bookingIds,
                customer_id: parseInt(primaryCustomerId),
                invoice_type: invoiceType,
                include_dives: includeDives,
                include_equipment: includeEquipment,
                include_excursions: includeExcursions,
                tax_percentage: taxPercentage || undefined,
            };

            const invoice = await invoiceService.generateBulk(request);
            
            if (onSuccess) {
                onSuccess();
            }
            
            onOpenChange(false);
            router.push(`/dashboard/invoices/${invoice.id}`);
            router.refresh();
        } catch (error) {
            console.error("Failed to generate bulk invoice", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Generate Bulk Invoice
                    </DialogTitle>
                    <DialogDescription>
                        Combine {bookingIds.length} bookings into a single invoice.
                    </DialogDescription>
                </DialogHeader>

                {loadingBookings ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        <Alert variant="default" className="bg-primary/5 border-primary/20">
                            <AlertCircle className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-sm font-semibold">Multiple Bookings Selected</AlertTitle>
                            <AlertDescription className="text-xs">
                                All items from the selected bookings will be added to one invoice. 
                                Each item description will show the diver's name in brackets.
                            </AlertDescription>
                        </Alert>

                        {/* Primary Customer Selection */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Bill To (Primary Customer)</Label>
                            <Select value={primaryCustomerId} onValueChange={setPrimaryCustomerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select primary customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bookingsData.map((b) => (
                                        <SelectItem key={b.customer_id} value={b.customer_id.toString()}>
                                            {b.customer?.full_name || `Customer #${b.customer_id}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-muted-foreground">
                                This customer will be the main recipient listed on the invoice.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Invoice Type */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Invoice Type</Label>
                                <RadioGroup value={invoiceType} onValueChange={(value) => setInvoiceType(value as any)}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Full" id="bulk-full" />
                                        <Label htmlFor="bulk-full" className="text-sm">Full Invoice</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Advance" id="bulk-advance" />
                                        <Label htmlFor="bulk-advance" className="text-sm">Advance</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Final" id="bulk-final" />
                                        <Label htmlFor="bulk-final" className="text-sm">Final Invoice</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Include Items */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Include Items</Label>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="bulk-include-dives"
                                            checked={includeDives}
                                            onCheckedChange={(checked) => setIncludeDives(checked as boolean)}
                                        />
                                        <Label htmlFor="bulk-include-dives" className="text-sm">Dives</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="bulk-include-equipment"
                                            checked={includeEquipment}
                                            onCheckedChange={(checked) => setIncludeEquipment(checked as boolean)}
                                        />
                                        <Label htmlFor="bulk-include-equipment" className="text-sm">Equipment</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="bulk-include-excursions"
                                            checked={includeExcursions}
                                            onCheckedChange={(checked) => setIncludeExcursions(checked as boolean)}
                                        />
                                        <Label htmlFor="bulk-include-excursions" className="text-sm">Excursions</Label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tax Percentage */}
                        <div className="space-y-2">
                            <Label htmlFor="bulk-tax" className="text-sm font-semibold">Tax Percentage (%)</Label>
                            <Input
                                id="bulk-tax"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={taxPercentage}
                                onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
                                placeholder="0"
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleGenerate} disabled={loading || !primaryCustomerId}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            "Generate Combined Invoice"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
