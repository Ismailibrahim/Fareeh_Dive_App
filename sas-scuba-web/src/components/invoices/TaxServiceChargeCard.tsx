"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Invoice } from "@/lib/api/services/invoice.service";
import { invoiceService } from "@/lib/api/services/invoice.service";
import { settingsService } from "@/lib/api/services/settings.service";
import { Percent, DollarSign, Info } from "lucide-react";

interface TaxServiceChargeCardProps {
    invoice: Invoice;
    onUpdate: () => void;
}

export function TaxServiceChargeCard({ invoice, onUpdate }: TaxServiceChargeCardProps) {
    const [loading, setLoading] = useState(false);
    const [discount, setDiscount] = useState<number>(0);
    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [lastFixedValue, setLastFixedValue] = useState<number>(0);
    const [lastPercentageValue, setLastPercentageValue] = useState<number>(0);
    const [taxCalculationMode, setTaxCalculationMode] = useState<'exclusive' | 'inclusive'>('exclusive');
    const [updatingMode, setUpdatingMode] = useState(false);

    useEffect(() => {
        // Fetch tax calculation mode from dive center settings
        const fetchTaxCalculationMode = async () => {
            try {
                const diveCenter = await settingsService.getDiveCenter();
                if (diveCenter.settings && diveCenter.settings.tax_calculation_mode) {
                    setTaxCalculationMode(diveCenter.settings.tax_calculation_mode);
                } else {
                    // Default to exclusive if not set
                    setTaxCalculationMode('exclusive');
                }
            } catch (error) {
                console.error("Failed to fetch tax calculation mode", error);
                setTaxCalculationMode('exclusive');
            }
        };

        fetchTaxCalculationMode();

        // Set discount value and determine type
        if (invoice.discount !== null && invoice.discount !== undefined) {
            const discountAmount = Number(invoice.discount);
            setDiscount(discountAmount);
            
            // Try to determine if it's a percentage by checking if it matches a percentage of subtotal
            const subtotal = Number(invoice.subtotal || 0);
            if (subtotal > 0 && discountAmount > 0) {
                const calculatedPercentage = (discountAmount / subtotal) * 100;
                // If it's close to a whole number percentage (within 0.01%), assume it's percentage
                if (Math.abs(calculatedPercentage - Math.round(calculatedPercentage)) < 0.01 && calculatedPercentage <= 100) {
                    setDiscountType('percentage');
                    const percentageValue = Math.round(calculatedPercentage * 100) / 100;
                    setDiscountValue(percentageValue);
                    setLastPercentageValue(percentageValue);
                    setLastFixedValue(discountAmount);
                } else {
                    setDiscountType('fixed');
                    setDiscountValue(discountAmount);
                    setLastFixedValue(discountAmount);
                    setLastPercentageValue(calculatedPercentage);
                }
            } else {
                setDiscountType('fixed');
                setDiscountValue(discountAmount);
                setLastFixedValue(discountAmount);
                setLastPercentageValue(0);
            }
        } else {
            setDiscount(0);
            setDiscountValue(0);
            setDiscountType('fixed');
            setLastFixedValue(0);
            setLastPercentageValue(0);
        }
    }, [invoice]);

    const calculateDiscount = (): number => {
        const subtotal = Number(invoice.subtotal || 0);
        if (discountType === 'percentage') {
            return subtotal * (discountValue / 100);
        } else {
            return discountValue;
        }
    };

    const handleDiscountTypeChange = (type: 'fixed' | 'percentage') => {
        const subtotal = Number(invoice.subtotal || 0);
        let newDiscountValue = 0;
        let calculatedDiscount = 0;
        
        if (type === 'percentage') {
            // Switching TO percentage: use last percentage value if available, otherwise calculate from current discount
            if (lastPercentageValue > 0) {
                // Use the last percentage value the user entered
                newDiscountValue = lastPercentageValue;
            } else if (subtotal > 0 && discount > 0) {
                // Calculate percentage from current discount amount
                const percentage = (discount / subtotal) * 100;
                newDiscountValue = Math.round(percentage * 100) / 100;
                setLastPercentageValue(newDiscountValue);
            } else {
                newDiscountValue = 0;
            }
            calculatedDiscount = subtotal * (newDiscountValue / 100);
        } else {
            // Switching TO fixed: use last fixed value if available, otherwise use current discount
            if (lastFixedValue > 0) {
                // Use the last fixed value the user entered
                newDiscountValue = lastFixedValue;
            } else {
                // Use current discount amount
                newDiscountValue = discount;
                setLastFixedValue(newDiscountValue);
            }
            calculatedDiscount = newDiscountValue;
        }
        
        setDiscountType(type);
        setDiscountValue(newDiscountValue);
        setDiscount(calculatedDiscount);
        
        // Don't auto-save when switching types - only update the display
        // The discount will be saved when user changes the value or leaves the field
    };

    const handleDiscountValueChange = (value: number) => {
        // Don't format while typing - just update the value
        setDiscountValue(value);
        
        // Store the last entered value based on type
        if (discountType === 'percentage') {
            setLastPercentageValue(value);
        } else {
            setLastFixedValue(value);
        }
        
        // Calculate discount for preview but don't save yet
        const subtotal = Number(invoice.subtotal || 0);
        let calculatedDiscount = 0;
        
        if (discountType === 'percentage') {
            calculatedDiscount = subtotal * (value / 100);
        } else {
            calculatedDiscount = value;
        }
        
        setDiscount(calculatedDiscount);
    };

    const handleDiscountBlur = async () => {
        setLoading(true);
        try {
            const subtotal = Number(invoice.subtotal || 0);
            const calculatedDiscount = calculateDiscount();
            const amountAfterDiscount = subtotal - calculatedDiscount;
            
            // Recalculate service charge on amount after discount
            let serviceCharge = 0;
            if (invoice.service_charge && invoice.service_charge > 0) {
                const originalSubtotal = Number(invoice.subtotal || subtotal);
                if (originalSubtotal > 0) {
                    const serviceChargePercentage = (invoice.service_charge / originalSubtotal) * 100;
                    serviceCharge = amountAfterDiscount * (serviceChargePercentage / 100);
                } else {
                    serviceCharge = Number(invoice.service_charge || 0);
                }
            }
            
            // Recalculate tax on (amount after discount + service charge)
            // T-GST is calculated on (Subtotal + Service Charge)
            let tax = 0;
            if (invoice.tax && invoice.tax > 0) {
                const originalSubtotal = Number(invoice.subtotal || subtotal);
                const originalServiceCharge = Number(invoice.service_charge || 0);
                if (originalSubtotal > 0) {
                    // Calculate tax percentage from original (subtotal + service charge)
                    const originalBase = originalSubtotal + originalServiceCharge;
                    if (originalBase > 0) {
                        const taxPercentage = (invoice.tax / originalBase) * 100;
                        tax = (amountAfterDiscount + serviceCharge) * (taxPercentage / 100);
                    } else {
                        tax = Number(invoice.tax || 0);
                    }
                } else {
                    tax = Number(invoice.tax || 0);
                }
            }
            
            const total = amountAfterDiscount + serviceCharge + tax;

            await invoiceService.update(invoice.id, {
                discount: calculatedDiscount,
                tax,
                service_charge: serviceCharge,
                total,
            });

            setDiscount(calculatedDiscount);
            setTimeout(() => {
                onUpdate();
            }, 100);
        } catch (error) {
            console.error("Failed to update discount", error);
            alert("Failed to update discount. Please try again.");
            // Revert to previous discount
            const previousDiscount = Number(invoice.discount || 0);
            setDiscount(previousDiscount);
            if (discountType === 'percentage') {
                const subtotal = Number(invoice.subtotal || 0);
                if (subtotal > 0) {
                    setDiscountValue((previousDiscount / subtotal) * 100);
                } else {
                    setDiscountValue(0);
                }
            } else {
                setDiscountValue(previousDiscount);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTaxCalculationModeChange = async (checked: boolean) => {
        // Prevent action if invoice is paid or already updating
        if (invoice.status === 'Paid' || updatingMode) {
            console.log('Prevented action - Paid:', invoice.status === 'Paid', 'Updating:', updatingMode);
            return;
        }

        const newMode = checked ? 'inclusive' : 'exclusive';
        console.log('Changing tax calculation mode from', taxCalculationMode, 'to', newMode);
        
        // Optimistically update UI
        const previousMode = taxCalculationMode;
        setTaxCalculationMode(newMode);
        setUpdatingMode(true);
        
        try {
            // Get current dive center settings
            console.log('Fetching dive center settings...');
            const diveCenter = await settingsService.getDiveCenter();
            const currentSettings = diveCenter.settings || {};
            console.log('Current settings:', JSON.stringify(currentSettings, null, 2));
            
            // Update tax calculation mode
            const updatedSettings = {
                ...currentSettings,
                tax_calculation_mode: newMode,
            };
            console.log('Updated settings:', JSON.stringify(updatedSettings, null, 2));

            // Update dive center settings
            console.log('Updating dive center settings...');
            await settingsService.updateDiveCenter({
                settings: updatedSettings,
            });
            console.log('Dive center settings updated successfully');

            // Wait a bit to ensure settings are persisted
            await new Promise(resolve => setTimeout(resolve, 100));

            // Trigger invoice recalculation by calling update with discount only
            // This will cause the backend to recalculate service charge and tax from scratch
            // using the new tax calculation mode
            const currentDiscount = Number(invoice.discount || 0);
            
            console.log('Triggering invoice recalculation with:', JSON.stringify({
                discount: currentDiscount,
                mode: newMode,
                note: 'Service charge and tax will be recalculated by backend',
            }, null, 2));
            
            // Call update with only discount to force backend to recalculate everything
            // The backend will recalculate service_charge and tax based on the new mode
            const updatedInvoice = await invoiceService.update(invoice.id, {
                discount: currentDiscount > 0 ? currentDiscount : 0,
                // Note: recalculate is handled by backend based on mode
            } as any);
            
            console.log('Invoice updated, new values:', JSON.stringify({
                subtotal: updatedInvoice.subtotal,
                discount: updatedInvoice.discount,
                service_charge: updatedInvoice.service_charge,
                tax: updatedInvoice.tax,
                total: updatedInvoice.total,
            }, null, 2));

            // Reload invoice to get updated values
            setTimeout(() => {
                console.log('Reloading invoice...');
                onUpdate();
            }, 300);
        } catch (error: any) {
            console.error("Failed to update tax calculation mode", error);
            console.error("Error details:", {
                message: error?.message,
                response: error?.response?.data,
                status: error?.response?.status,
            });
            
            // Revert to previous mode on error
            setTaxCalculationMode(previousMode);
            
            // Show error message
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to update tax calculation mode. Please try again.";
            alert(errorMessage);
        } finally {
            setUpdatingMode(false);
        }
    };

    return (
        <Card className="no-print mb-6">
            <CardHeader>
                <CardTitle>Discount</CardTitle>
                <CardDescription>
                    Tax and Service Charge are automatically applied based on price list item settings
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* T-GST Calculation Mode Checkbox */}
                <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-md border">
                    <div className="mt-1">
                        <Checkbox
                            id="tgst-inclusive-mode"
                            checked={taxCalculationMode === 'inclusive'}
                            onCheckedChange={(checked) => {
                                console.log('Checkbox changed:', checked, 'Current mode:', taxCalculationMode, 'Disabled:', updatingMode || invoice.status === 'Paid');
                                if (checked !== 'indeterminate' && !updatingMode && invoice.status !== 'Paid') {
                                    handleTaxCalculationModeChange(checked === true);
                                }
                            }}
                            disabled={updatingMode || invoice.status === 'Paid'}
                        />
                    </div>
                    <div className="flex-1 space-y-1">
                        <Label 
                            htmlFor="tgst-inclusive-mode" 
                            className={`font-medium ${(updatingMode || invoice.status === 'Paid') ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            onClick={(e) => {
                                if (updatingMode || invoice.status === 'Paid') {
                                    e.preventDefault();
                                    return;
                                }
                                e.preventDefault();
                                console.log('Label clicked, toggling mode');
                                handleTaxCalculationModeChange(taxCalculationMode !== 'inclusive');
                            }}
                        >
                            T-GST INCLUSIVE Calculation
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            {taxCalculationMode === 'inclusive' 
                                ? "Using reverse calculation: Grand Total is broken down into base amount, service charge, and T-GST portions."
                                : "Using forward calculation: Items → Discount → Service Charge → T-GST → Grand Total (default)."}
                        </p>
                        {invoice.status === 'Paid' && (
                            <p className="text-xs text-amber-600 dark:text-amber-500">
                                Cannot change calculation mode for paid invoices
                            </p>
                        )}
                        {updatingMode && (
                            <p className="text-xs text-muted-foreground">
                                Updating...
                            </p>
                        )}
                    </div>
                </div>

                {/* Discount Field */}
                <div className="space-y-2 pt-2 border-t">
                    <Label htmlFor="discount" className="text-sm font-medium">
                        Discount
                    </Label>
                    <div className="flex gap-2">
                        <Select
                            value={discountType}
                            onValueChange={(value: 'fixed' | 'percentage') => handleDiscountTypeChange(value)}
                            disabled={loading || invoice.status === 'Paid'}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                                <SelectItem value="percentage">Percentage</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="relative flex-1">
                            {discountType === 'percentage' ? (
                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            ) : (
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            )}
                            <Input
                                id="discount"
                                type="text"
                                inputMode="decimal"
                                value={discountValue === 0 ? '' : discountValue.toString()}
                                onChange={(e) => {
                                    const inputValue = e.target.value;
                                    // Allow empty input or valid number
                                    if (inputValue === '' || inputValue === '.') {
                                        setDiscountValue(0);
                                        setDiscount(0);
                                        return;
                                    }
                                    // Allow typing numbers and decimal point
                                    const numericValue = parseFloat(inputValue);
                                    if (!isNaN(numericValue) && numericValue >= 0) {
                                        // For percentage, limit to 100
                                        if (discountType === 'percentage' && numericValue > 100) {
                                            return;
                                        }
                                        handleDiscountValueChange(numericValue);
                                    }
                                }}
                                onBlur={handleDiscountBlur}
                                disabled={loading || invoice.status === 'Paid'}
                                className="pl-9"
                                placeholder={discountType === 'percentage' ? "0.00" : "0.00"}
                            />
                        </div>
                    </div>
                    {invoice.status === 'Paid' && (
                        <p className="text-xs text-amber-600 dark:text-amber-500">
                            Discount cannot be changed for paid invoices
                        </p>
                    )}
                    {invoice.status !== 'Paid' && discountType === 'percentage' && discountValue > 0 && (
                        <p className="text-xs text-muted-foreground">
                            Discount: ${calculateDiscount().toFixed(2)} ({discountValue}% of ${Number(invoice.subtotal || 0).toFixed(2)})
                        </p>
                    )}
                    {invoice.status !== 'Paid' && discountType === 'fixed' && (
                        <p className="text-xs text-muted-foreground">
                            Enter discount amount to be deducted from the total
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

