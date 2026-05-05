"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { customerService, Customer } from "@/lib/api/services/customer.service";
import { bookingExcursionService, BookingExcursion } from "@/lib/api/services/booking-excursion.service";
import { invoiceService } from "@/lib/api/services/invoice.service";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Search, User, X, Plus, Receipt, Loader2, Trash2, AlertCircle
} from "lucide-react";

interface CustomerEntry {
    customer: Customer;
    excursions: BookingExcursion[];
    loadingExcursions: boolean;
    selectedExcursionBookingIds: Set<number>;
}

export default function CreateCombinedInvoicePage() {
    const router = useRouter();

    // Customer search
    const [customerSearch, setCustomerSearch] = useState("");
    const [customerResults, setCustomerResults] = useState<Customer[]>([]);
    const [searchingCustomers, setSearchingCustomers] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Selected customers with their excursions
    const [customerEntries, setCustomerEntries] = useState<CustomerEntry[]>([]);

    // Bill-to customer
    const [billingCustomer, setBillingCustomer] = useState<Customer | null>(null);

    // Invoice options
    const [invoiceType, setInvoiceType] = useState<"Advance" | "Final" | "Full">("Full");
    const [includeDives, setIncludeDives] = useState(true);
    const [includeEquipment, setIncludeEquipment] = useState(true);
    const [includeExcursions, setIncludeExcursions] = useState(true);

    // Generation state
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Customer Search ---
    const searchCustomers = useCallback(async (query: string) => {
        if (!query.trim()) { setCustomerResults([]); setShowDropdown(false); return; }
        setSearchingCustomers(true);
        try {
            const result = await customerService.getAll({ search: query, per_page: 8 });
            const list = Array.isArray(result) ? result : result.data || [];
            setCustomerResults(list);
            setShowDropdown(list.length > 0);
        } catch { setCustomerResults([]); }
        finally { setSearchingCustomers(false); }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => searchCustomers(customerSearch), 300);
        return () => clearTimeout(timer);
    }, [customerSearch, searchCustomers]);

    const addCustomer = async (customer: Customer) => {
        if (customerEntries.some((e) => e.customer.id === customer.id)) {
            setCustomerSearch("");
            setShowDropdown(false);
            return;
        }

        const entry: CustomerEntry = {
            customer,
            excursions: [],
            loadingExcursions: true,
            selectedExcursionBookingIds: new Set(),
        };

        setCustomerEntries((prev) => [...prev, entry]);
        setCustomerSearch("");
        setShowDropdown(false);

        // Auto-set billing customer if none set
        setBillingCustomer((prev) => prev ?? customer);

        // Load their excursions
        try {
            const data = await bookingExcursionService.getAll();
            const all = Array.isArray(data) ? data : (data as any).data || [];
            const mine: BookingExcursion[] = all.filter(
                (be: BookingExcursion) => be.booking?.customer?.id === customer.id
            );
            // Pre-select all uninvoiced ones
            const uninvoiced = mine.filter((be) => !be.invoice_item);
            setCustomerEntries((prev) =>
                prev.map((e) =>
                    e.customer.id === customer.id
                        ? {
                            ...e,
                            excursions: mine,
                            loadingExcursions: false,
                            selectedExcursionBookingIds: new Set(
                                uninvoiced.map((be) => be.booking_id).filter(Boolean) as number[]
                            ),
                          }
                        : e
                )
            );
        } catch {
            setCustomerEntries((prev) =>
                prev.map((e) =>
                    e.customer.id === customer.id ? { ...e, loadingExcursions: false } : e
                )
            );
        }
    };

    const removeCustomer = (customerId: number) => {
        setCustomerEntries((prev) => prev.filter((e) => e.customer.id !== customerId));
        if (billingCustomer?.id === customerId) {
            const remaining = customerEntries.filter((e) => e.customer.id !== customerId);
            setBillingCustomer(remaining[0]?.customer ?? null);
        }
    };

    const toggleExcursionBooking = (customerId: number, bookingId: number) => {
        setCustomerEntries((prev) =>
            prev.map((e) => {
                if (e.customer.id !== customerId) return e;
                const next = new Set(e.selectedExcursionBookingIds);
                if (next.has(bookingId)) next.delete(bookingId);
                else next.add(bookingId);
                return { ...e, selectedExcursionBookingIds: next };
            })
        );
    };

    // Collect all selected unique booking IDs
    const allSelectedBookingIds = [
        ...new Set(
            customerEntries.flatMap((e) => [...e.selectedExcursionBookingIds])
        ),
    ];

    // Estimated total
    const estimatedTotal = customerEntries.reduce((sum, entry) => {
        return (
            sum +
            entry.excursions
                .filter((be) => be.booking_id && entry.selectedExcursionBookingIds.has(be.booking_id))
                .reduce((s, be) => s + Number(be.price || 0) * (be.number_of_participants || 1), 0)
        );
    }, 0);

    const handleGenerate = async () => {
        if (!billingCustomer) { setError("Please select a customer to bill."); return; }
        if (allSelectedBookingIds.length === 0) { setError("Please select at least one booking."); return; }

        setGenerating(true);
        setError(null);
        try {
            const invoice = await invoiceService.generateBulk({
                booking_ids: allSelectedBookingIds,
                customer_id: billingCustomer.id,
                invoice_type: invoiceType,
                include_dives: includeDives,
                include_equipment: includeEquipment,
                include_excursions: includeExcursions,
            });
            router.push(`/dashboard/invoices/${invoice.id}`);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to generate invoice. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Combined Invoice" />
            <div className="flex-1 p-8 pt-6 max-w-4xl mx-auto w-full space-y-6">
                {/* Page Header */}
                <div>
                    <Link
                        href="/dashboard/booking-excursions"
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Booking Excursions
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Combined Invoice</h1>
                    <p className="text-muted-foreground">
                        Combine bookings from multiple customers into a single invoice.
                    </p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Customer Selection & Bookings */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Add Customer */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    Add Customers
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        placeholder="Search and add customers..."
                                        className="pl-9"
                                    />
                                    {searchingCustomers && (
                                        <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                    {showDropdown && customerResults.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-md overflow-hidden">
                                            {customerResults.map((c) => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    disabled={customerEntries.some((e) => e.customer.id === c.id)}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50"
                                                    onClick={() => addCustomer(c)}
                                                >
                                                    <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span>{c.full_name}</span>
                                                    {c.email && <span className="text-muted-foreground text-xs ml-auto">{c.email}</span>}
                                                    {customerEntries.some((e) => e.customer.id === c.id) && (
                                                        <span className="text-xs text-muted-foreground ml-auto">Added</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Customer Entries with their Bookings */}
                        {customerEntries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed rounded-xl text-muted-foreground gap-3">
                                <User className="h-10 w-10 opacity-30" />
                                <p className="text-sm">Search and add customers above to select their bookings.</p>
                            </div>
                        ) : (
                            customerEntries.map((entry) => (
                                <Card key={entry.customer.id}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{entry.customer.full_name}</p>
                                                    {entry.customer.email && (
                                                        <p className="text-xs text-muted-foreground">{entry.customer.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs text-primary"
                                                    onClick={() => setBillingCustomer(entry.customer)}
                                                    disabled={billingCustomer?.id === entry.customer.id}
                                                >
                                                    {billingCustomer?.id === entry.customer.id ? "✓ Billing" : "Set as Bill-To"}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                    onClick={() => removeCustomer(entry.customer.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {entry.loadingExcursions ? (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading bookings...
                                            </div>
                                        ) : entry.excursions.length === 0 ? (
                                            <p className="text-sm text-muted-foreground py-2">No excursion bookings found.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                                    Excursion Bookings
                                                </p>
                                                {entry.excursions.map((be) => {
                                                    const bookingId = be.booking_id;
                                                    if (!bookingId) return null;
                                                    const isSelected = entry.selectedExcursionBookingIds.has(bookingId);
                                                    return (
                                                        <div
                                                            key={be.id}
                                                            className={`flex items-center justify-between p-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${isSelected ? "border-primary/40 bg-primary/5" : "hover:bg-muted/50"}`}
                                                            onClick={() => toggleExcursionBooking(entry.customer.id, bookingId)}
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={() => toggleExcursionBooking(entry.customer.id, bookingId)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                                <div>
                                                                    <p className="font-medium">{be.excursion?.name || "Excursion"}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {be.excursion_date || "No date"} · {be.number_of_participants || 1} participant(s)
                                                                        · Status: {be.status || "Scheduled"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className="font-semibold shrink-0 ml-4">
                                                                ${(Number(be.price || 0) * (be.number_of_participants || 1)).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Right: Invoice Settings Sidebar */}
                    <div className="space-y-4">
                        {/* Bill To */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Bill To</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {billingCustomer ? (
                                    <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <User className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{billingCustomer.full_name}</p>
                                            {billingCustomer.email && (
                                                <p className="text-xs text-muted-foreground truncate">{billingCustomer.email}</p>
                                            )}
                                        </div>
                                        <button onClick={() => setBillingCustomer(null)} className="text-muted-foreground hover:text-foreground">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Add customers and click "Set as Bill-To" or the first customer will be used.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Invoice Type */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Invoice Type</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup
                                    value={invoiceType}
                                    onValueChange={(v) => setInvoiceType(v as "Advance" | "Final" | "Full")}
                                    className="space-y-2"
                                >
                                    {[
                                        { value: "Full", label: "Full Invoice" },
                                        { value: "Advance", label: "Advance Payment" },
                                        { value: "Final", label: "Final Invoice" },
                                    ].map(({ value, label }) => (
                                        <div key={value} className="flex items-center space-x-2">
                                            <RadioGroupItem value={value} id={`page-type-${value}`} />
                                            <Label htmlFor={`page-type-${value}`} className="font-normal">{label}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </CardContent>
                        </Card>

                        {/* Include Items */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Include Items</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {[
                                    { id: "exc", label: "Excursions", checked: includeExcursions, onChange: setIncludeExcursions },
                                    { id: "div", label: "Dives",      checked: includeDives,      onChange: setIncludeDives },
                                    { id: "eqp", label: "Equipment",  checked: includeEquipment,  onChange: setIncludeEquipment },
                                ].map(({ id, label, checked, onChange }) => (
                                    <div key={id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`page-inc-${id}`}
                                            checked={checked}
                                            onCheckedChange={(v) => onChange(v as boolean)}
                                        />
                                        <Label htmlFor={`page-inc-${id}`} className="font-normal">{label}</Label>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Total Summary */}
                        <Card className="border-primary/20 bg-primary/5">
                            <CardContent className="pt-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Customers</span>
                                    <span className="font-medium">{customerEntries.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Bookings selected</span>
                                    <span className="font-medium">{allSelectedBookingIds.length}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="font-semibold">Estimated Total</span>
                                    <span className="font-bold text-lg text-primary">${estimatedTotal.toFixed(2)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleGenerate}
                            disabled={generating || allSelectedBookingIds.length === 0 || !billingCustomer}
                        >
                            {generating ? (
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
                    </div>
                </div>
            </div>
        </div>
    );
}
