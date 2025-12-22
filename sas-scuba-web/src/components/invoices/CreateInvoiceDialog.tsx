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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { invoiceService } from "@/lib/api/services/invoice.service";
import { customerService, Customer } from "@/lib/api/services/customer.service";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";

interface CreateInvoiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreateInvoiceDialog({
    open,
    onOpenChange,
    onSuccess,
}: CreateInvoiceDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [invoiceType, setInvoiceType] = useState<'Advance' | 'Final' | 'Full'>('Full');
    const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (open) {
            loadCustomers();
        }
    }, [open]);

    const loadCustomers = async () => {
        setLoadingCustomers(true);
        try {
            const data = await customerService.getAll({ per_page: 100 });
            const customerList = Array.isArray(data) ? data : (data as any).data || [];
            setCustomers(customerList);
        } catch (error) {
            console.error("Failed to load customers", error);
        } finally {
            setLoadingCustomers(false);
        }
    };

    const handleCreate = async () => {
        if (!selectedCustomerId) return;

        setLoading(true);
        try {
            const invoice = await invoiceService.create({
                customer_id: selectedCustomerId,
                invoice_type: invoiceType,
                invoice_date: invoiceDate,
            });
            
            if (onSuccess) {
                onSuccess();
            }
            
            onOpenChange(false);
            router.push(`/dashboard/invoices/${invoice.id}`);
            router.refresh();
        } catch (error: any) {
            console.error("Failed to create invoice", error);
            const errorMessage = error?.response?.data?.message || "Failed to create invoice";
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(customer => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            customer.full_name?.toLowerCase().includes(search) ||
            customer.email?.toLowerCase().includes(search) ||
            customer.phone?.toLowerCase().includes(search) ||
            customer.passport_no?.toLowerCase().includes(search)
        );
    });

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Create Invoice</DialogTitle>
                    <DialogDescription className="text-base">
                        Select a customer to create an invoice for. You can add items to the invoice after creation.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Customer Selection */}
                    <div className="space-y-3">
                        <Label htmlFor="customer" className="text-base font-semibold">Customer *</Label>
                        <div className="space-y-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search customers by name, email, phone, or passport..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select
                                value={selectedCustomerId?.toString() || ""}
                                onValueChange={(value) => setSelectedCustomerId(Number(value))}
                                disabled={loadingCustomers}
                            >
                                <SelectTrigger id="customer" className="h-11">
                                    <SelectValue placeholder={loadingCustomers ? "Loading customers..." : "Select a customer"} />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {filteredCustomers.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-muted-foreground">
                                            {searchTerm ? "No customers found matching your search" : "No customers available"}
                                        </div>
                                    ) : (
                                        filteredCustomers.map((customer) => (
                                            <SelectItem key={customer.id} value={customer.id.toString()}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{customer.full_name}</span>
                                                    {customer.email && (
                                                        <span className="text-xs text-muted-foreground">{customer.email}</span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedCustomer && (
                            <div className="p-3 bg-muted rounded-lg space-y-1">
                                <p className="text-sm font-medium">{selectedCustomer.full_name}</p>
                                {selectedCustomer.email && (
                                    <p className="text-xs text-muted-foreground">Email: {selectedCustomer.email}</p>
                                )}
                                {selectedCustomer.phone && (
                                    <p className="text-xs text-muted-foreground">Phone: {selectedCustomer.phone}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Invoice Type */}
                    <div className="space-y-3">
                        <Label htmlFor="invoice-type" className="text-base font-semibold">Invoice Type</Label>
                        <Select
                            value={invoiceType}
                            onValueChange={(value) => setInvoiceType(value as 'Advance' | 'Final' | 'Full')}
                        >
                            <SelectTrigger id="invoice-type" className="h-11">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Full">Full Invoice</SelectItem>
                                <SelectItem value="Advance">Advance Payment</SelectItem>
                                <SelectItem value="Final">Final Invoice</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Invoice Date */}
                    <div className="space-y-3">
                        <Label htmlFor="invoice-date" className="text-base font-semibold">Invoice Date</Label>
                        <Input
                            id="invoice-date"
                            type="date"
                            value={invoiceDate}
                            onChange={(e) => setInvoiceDate(e.target.value)}
                            className="h-11"
                        />
                    </div>

                    {/* Info Box */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Note:</p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            An empty invoice will be created. You can add items manually after creation using the "Add Item" button on the invoice detail page.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={loading || !selectedCustomerId}
                        className="min-w-[140px]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Invoice"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
