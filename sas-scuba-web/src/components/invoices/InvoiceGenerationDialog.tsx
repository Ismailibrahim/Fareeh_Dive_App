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
import { invoiceService, GenerateInvoiceRequest } from "@/lib/api/services/invoice.service";
import { bookingService, Booking } from "@/lib/api/services/booking.service";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface InvoiceGenerationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bookingId: number;
    onSuccess?: () => void;
}

export function InvoiceGenerationDialog({
    open,
    onOpenChange,
    bookingId,
    onSuccess,
}: InvoiceGenerationDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState<Booking | null>(null);
    const [invoiceType, setInvoiceType] = useState<'Advance' | 'Final' | 'Full'>('Full');
    const [includeDives, setIncludeDives] = useState(true);
    const [includeEquipment, setIncludeEquipment] = useState(true);
    const [includeExcursions, setIncludeExcursions] = useState(true);
    const [taxPercentage, setTaxPercentage] = useState<number>(0);

    useEffect(() => {
        if (open && bookingId) {
            bookingService.getById(bookingId).then(setBooking).catch(console.error);
        }
    }, [open, bookingId]);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const request: GenerateInvoiceRequest = {
                booking_id: bookingId,
                invoice_type: invoiceType,
                include_dives: includeDives,
                include_equipment: includeEquipment,
                include_excursions: includeExcursions,
                tax_percentage: taxPercentage || undefined,
            };

            const invoice = await invoiceService.generateFromBooking(request);
            
            if (onSuccess) {
                onSuccess();
            }
            
            onOpenChange(false);
            router.push(`/dashboard/invoices/${invoice.id}`);
            router.refresh();
        } catch (error) {
            console.error("Failed to generate invoice", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Generate Invoice</DialogTitle>
                    <DialogDescription>
                        {booking?.customer?.full_name && (
                            <>Generate invoice for {booking.customer.full_name}</>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Invoice Type */}
                    <div className="space-y-3">
                        <Label>Invoice Type</Label>
                        <RadioGroup value={invoiceType} onValueChange={(value) => setInvoiceType(value as any)}>
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
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="include-excursions"
                                    checked={includeExcursions}
                                    onCheckedChange={(checked) => setIncludeExcursions(checked as boolean)}
                                />
                                <Label htmlFor="include-excursions">Include Completed Excursions</Label>
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
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleGenerate} disabled={loading}>
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

