"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { invoiceService } from "@/lib/api/services/invoice.service";
import { customerService, Customer } from "@/lib/api/services/customer.service";
import { BookingExcursion } from "@/lib/api/services/booking-excursion.service";
import { useRouter } from "next/navigation";
import { Loader2, User, Search, X, Receipt } from "lucide-react";

interface CombinedInvoiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The booking IDs to combine */
    bookingIds: number[];
    /** The selected excursion rows (for display only) */
    selectedRows: BookingExcursion[];
    onSuccess?: () => void;
}

export function CombinedInvoiceDialog({
    open,
    onOpenChange,
    bookingIds,
    selectedRows,
    onSuccess,
}: CombinedInvoiceDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Billing customer
    const [billingCustomerSearch, setBillingCustomerSearch] = useState("");
    const [billingCustomer, setBillingCustomer] = useState<Customer | null>(null);
    const [customerResults, setCustomerResults] = useState<Customer[]>([]);
    const [searchingCustomers, setSearchingCustomers] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Invoice options
    const [invoiceType, setInvoiceType] = useState<"Advance" | "Final" | "Full">("Full");
    const [includeDives, setIncludeDives] = useState(true);
    const [includeEquipment, setIncludeEquipment] = useState(true);
    const [includeExcursions, setIncludeExcursions] = useState(true);

    // Auto-set billing customer to the first selected row's customer
    useEffect(() => {
        if (open && selectedRows.length > 0 && !billingCustomer) {
            const firstCustomer = selectedRows[0].booking?.customer;
            if (firstCustomer) {
                setBillingCustomer(firstCustomer as Customer);
                setBillingCustomerSearch(firstCustomer.full_name);
            }
        }
        if (!open) {
            setError(null);
            setBillingCustomerSearch("");
            setBillingCustomer(null);
            setCustomerResults([]);
        }
    }, [open, selectedRows]);

    const searchCustomers = useCallback(async (query: string) => {
        if (!query.trim()) {
            setCustomerResults([]);
            setShowDropdown(false);
            return;
        }
        setSearchingCustomers(true);
        try {
            const result = await customerService.getAll({ search: query, per_page: 8 });
            const list = Array.isArray(result) ? result : result.data || [];
            setCustomerResults(list);
            setShowDropdown(list.length > 0);
        } catch {
            setCustomerResults([]);
        } finally {
            setSearchingCustomers(false);
        }
    }, []);

    useEffect(() => {
        if (billingCustomer) return; // already selected
        const timer = setTimeout(() => searchCustomers(billingCustomerSearch), 300);
        return () => clearTimeout(timer);
    }, [billingCustomerSearch, billingCustomer, searchCustomers]);

    const selectBillingCustomer = (customer: Customer) => {
        setBillingCustomer(customer);
        setBillingCustomerSearch(customer.full_name);
        setShowDropdown(false);
        setCustomerResults([]);
    };

    const clearBillingCustomer = () => {
        setBillingCustomer(null);
        setBillingCustomerSearch("");
        setCustomerResults([]);
    };

    const handleGenerate = async () => {
        if (!billingCustomer) {
            setError("Please select a customer to bill.");
            return;
        }
        if (bookingIds.length === 0) {
            setError("No bookings selected.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const invoice = await invoiceService.generateBulk({
                booking_ids: bookingIds,
                customer_id: billingCustomer.id,
                invoice_type: invoiceType,
                include_dives: includeDives,
                include_equipment: includeEquipment,
                include_excursions: includeExcursions,
            });
            if (onSuccess) onSuccess();
            onOpenChange(false);
            router.push(`/dashboard/invoices/${invoice.id}`);
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to generate combined invoice.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Compute total from selected rows
    const estimatedTotal = selectedRows.reduce((sum, row) => {
        return sum + Number(row.price || 0) * (row.number_of_participants || 1);
    }, 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-primary" />
                        Combined Invoice
                    </DialogTitle>
                    <DialogDescription>
                        Combine {selectedRows.length} booking{selectedRows.length !== 1 ? "s" : ""} into a single invoice
                    </DialogDescription>
                </DialogHeader>

                {/* Error */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-md px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <div className="space-y-5 py-2">
                    {/* Selected Bookings Summary */}
                    <div>
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                            Selected Bookings ({selectedRows.length})
                        </Label>
                        <div className="border rounded-lg overflow-hidden divide-y max-h-44 overflow-y-auto">
                            {selectedRows.map((row) => (
                                <div key={row.id} className="flex items-center justify-between px-3 py-2 text-sm bg-muted/30">
                                    <div className="flex items-center gap-2">
                                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <div>
                                            <span className="font-medium">{row.booking?.customer?.full_name || "Unknown"}</span>
                                            <span className="text-muted-foreground ml-2">· {row.excursion?.name || "Excursion"}</span>
                                        </div>
                                    </div>
                                    <span className="font-medium shrink-0">
                                        ${(Number(row.price || 0) * (row.number_of_participants || 1)).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="text-right text-sm font-semibold mt-1.5">
                            Estimated Total: <span className="text-primary">${estimatedTotal.toFixed(2)}</span>
                        </p>
                    </div>

                    {/* Bill To */}
                    <div>
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                            Bill To (Billing Customer)
                        </Label>
                        <div className="relative">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={billingCustomerSearch}
                                    onChange={(e) => {
                                        setBillingCustomerSearch(e.target.value);
                                        if (billingCustomer) setBillingCustomer(null);
                                    }}
                                    placeholder="Search customer to bill..."
                                    className="pl-9 pr-9"
                                />
                                {billingCustomer && (
                                    <button
                                        type="button"
                                        onClick={clearBillingCustomer}
                                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                                {searchingCustomers && (
                                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                            </div>
                            {showDropdown && customerResults.length > 0 && !billingCustomer && (
                                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-md overflow-hidden">
                                    {customerResults.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                            onClick={() => selectBillingCustomer(c)}
                                        >
                                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span>{c.full_name}</span>
                                            {c.email && <span className="text-muted-foreground text-xs ml-auto">{c.email}</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {billingCustomer && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-1.5">
                                <User className="h-3.5 w-3.5" />
                                Billing: <strong>{billingCustomer.full_name}</strong>
                                {billingCustomer.email && <span className="text-muted-foreground ml-1">({billingCustomer.email})</span>}
                            </div>
                        )}
                    </div>

                    {/* Include Items */}
                    <div>
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                            Include Items
                        </Label>
                        <div className="space-y-2">
                            {[
                                { id: "excursions", label: "Excursions", checked: includeExcursions, onChange: setIncludeExcursions },
                                { id: "dives",      label: "Dives",      checked: includeDives,      onChange: setIncludeDives },
                                { id: "equipment",  label: "Equipment",  checked: includeEquipment,  onChange: setIncludeEquipment },
                            ].map(({ id, label, checked, onChange }) => (
                                <div key={id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`combined-${id}`}
                                        checked={checked}
                                        onCheckedChange={(v) => onChange(v as boolean)}
                                    />
                                    <Label htmlFor={`combined-${id}`} className="font-normal">{label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Invoice Type */}
                    <div>
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                            Invoice Type
                        </Label>
                        <RadioGroup
                            value={invoiceType}
                            onValueChange={(v) => setInvoiceType(v as "Advance" | "Final" | "Full")}
                            className="flex gap-4"
                        >
                            {[
                                { value: "Full",    label: "Full Invoice" },
                                { value: "Advance", label: "Advance Payment" },
                                { value: "Final",   label: "Final Invoice" },
                            ].map(({ value, label }) => (
                                <div key={value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={value} id={`combined-type-${value}`} />
                                    <Label htmlFor={`combined-type-${value}`} className="font-normal">{label}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleGenerate} disabled={loading || !billingCustomer}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Receipt className="mr-2 h-4 w-4" />
                                Generate Combined Invoice
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
