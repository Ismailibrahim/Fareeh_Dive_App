"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { invoiceService, Invoice } from "@/lib/api/services/invoice.service";
import { paymentService, Payment } from "@/lib/api/services/payment.service";
import { settingsService } from "@/lib/api/services/settings.service";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { InvoiceGenerationDialog } from "@/components/invoices/InvoiceGenerationDialog";
import { AddInvoiceItemForm } from "@/components/invoices/AddInvoiceItemForm";
import { TaxServiceChargeCard } from "@/components/invoices/TaxServiceChargeCard";
import { DollarSign, FileText, Plus, Printer, Trash2 } from "lucide-react";
import { safeFormatDate } from "@/lib/utils/date-format";
import Link from "next/link";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const invoiceId = params.id as string;
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [showAddItemForm, setShowAddItemForm] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: number; description: string } | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [taxCalculationMode, setTaxCalculationMode] = useState<'exclusive' | 'inclusive'>('exclusive');

    useEffect(() => {
        if (!invoiceId) return;

        const loadInvoice = async () => {
            try {
                const data = await invoiceService.getById(invoiceId);
                setInvoice(data);
            } catch (error) {
                console.error("Failed to load invoice", error);
            } finally {
                setLoading(false);
            }
        };

        const loadPayments = async () => {
            try {
                const data = await paymentService.getAll(Number(invoiceId));
                const paymentList = Array.isArray(data) ? data : (data as any).data || [];
                setPayments(paymentList);
            } catch (error) {
                console.error("Failed to load payments", error);
            }
        };

        const loadTaxCalculationMode = async () => {
            try {
                const diveCenter = await settingsService.getDiveCenter();
                if (diveCenter.settings && diveCenter.settings.tax_calculation_mode) {
                    setTaxCalculationMode(diveCenter.settings.tax_calculation_mode);
                } else {
                    setTaxCalculationMode('exclusive');
                }
            } catch (error) {
                console.error("Failed to load tax calculation mode", error);
                setTaxCalculationMode('exclusive');
            }
        };

        loadInvoice();
        loadPayments();
        loadTaxCalculationMode();
    }, [invoiceId]);

    const loadInvoice = async () => {
        if (!invoiceId) return;
        try {
            const data = await invoiceService.getById(invoiceId);
            setInvoice(data);
            
            // Also reload tax calculation mode
            try {
                const diveCenter = await settingsService.getDiveCenter();
                if (diveCenter.settings && diveCenter.settings.tax_calculation_mode) {
                    setTaxCalculationMode(diveCenter.settings.tax_calculation_mode);
                } else {
                    setTaxCalculationMode('exclusive');
                }
            } catch (error) {
                console.error("Failed to load tax calculation mode", error);
            }
        } catch (error) {
            console.error("Failed to load invoice", error);
        } finally {
            setLoading(false);
        }
    };

    const loadPayments = async () => {
        if (!invoiceId) return;
        try {
            const data = await paymentService.getAll(Number(invoiceId));
            const paymentList = Array.isArray(data) ? data : (data as any).data || [];
            setPayments(paymentList);
        } catch (error) {
            console.error("Failed to load payments", error);
        }
    };

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const invoiceTotal = invoice ? Number(invoice.total || 0) : 0;
    const remainingBalance = invoiceTotal - totalPaid;
    
    // Calculate values for display matching Excel calculation
    // Calculate subtotal before any discounts (sum of quantity × unit_price)
    const subtotalBeforeDiscounts = invoice?.invoice_items?.reduce((sum, item) => {
        const itemSubtotal = Number(item.quantity || 0) * Number(item.unit_price || 0);
        return sum + itemSubtotal;
    }, 0) || 0;
    
    // Calculate total of all line item discounts
    const totalItemDiscounts = invoice?.invoice_items?.reduce((sum, item) => {
        const itemDiscount = item.discount ? Number(item.discount) : 0;
        return sum + itemDiscount;
    }, 0) || 0;
    
    // Get invoice discount
    const invoiceDiscountRaw = invoice?.discount;
    const invoiceDiscount = (invoiceDiscountRaw !== null && invoiceDiscountRaw !== undefined && invoiceDiscountRaw !== '' && invoiceDiscountRaw !== 0) 
        ? Number(invoiceDiscountRaw) 
        : 0;
    
    // Total discount sum (item discounts + invoice discount)
    const discountSum = totalItemDiscounts + invoiceDiscount;
    
    // Subtotal after all discounts
    const subtotal = Number(invoice?.subtotal || 0); // This already includes item discounts
    const subtotalAfterDiscount = subtotal - invoiceDiscount;
    const serviceCharge = invoice?.service_charge ? Number(invoice.service_charge) : 0;
    const subtotalPlusServiceCharge = subtotalAfterDiscount + serviceCharge;
    const tax = invoice?.tax ? Number(invoice.tax) : 0;
    
    // In INCLUSIVE mode: subtotalAfterDiscount IS the inclusive total (already includes SC + T-GST)
    // In EXCLUSIVE mode: add SC and T-GST on top
    const grandTotal = taxCalculationMode === 'inclusive' 
        ? subtotalAfterDiscount  // Grand Total = Subtotal After Discount (already inclusive)
        : subtotalPlusServiceCharge + tax;  // Grand Total = Subtotal + SC + T-GST

    const handleDeleteClick = (item: { id: number; description?: string }) => {
        setItemToDelete({ id: item.id, description: item.description || 'this item' });
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!itemToDelete || !invoice) return;
        
        setDeleting(true);
        try {
            await invoiceService.deleteItem(invoice.id, itemToDelete.id);
            await loadInvoice(); // Reload invoice to get updated totals
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        } catch (error: any) {
            console.error("Failed to delete item", error);
            const errorMessage = error?.response?.data?.message || error?.response?.data?.error || "Failed to delete item";
            alert(errorMessage);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Invoice Details" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Invoice Details" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-muted-foreground">Invoice not found</p>
                        <Link href="/dashboard/invoices">
                            <Button variant="outline" className="mt-4">
                                Back to Invoices
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const customer = invoice.booking?.customer || invoice.customer;
    const customerName = customer?.full_name || 'Unknown Customer';
    const customerEmail = customer?.email;
    const customerPhone = customer?.phone;
    const customerAddress = customer?.address;
    const customerCity = customer?.city;
    const customerCountry = customer?.country;
    const customerZip = customer?.zip_code;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title={`Invoice ${invoice.invoice_no || `#${invoice.id}`}`} />
            <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between no-print">
                <div>
                    <Link href="/dashboard/invoices" className="text-sm text-muted-foreground hover:underline mb-2 block">
                        ← Back to Invoices
                    </Link>
                    <h1 className="text-3xl font-bold">
                        {invoice.invoice_no || `Invoice #${invoice.id}`}
                    </h1>
                    <p className="text-muted-foreground">
                        {customerName}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                    {invoice.status === 'Draft' && (
                        <Button variant="outline" onClick={() => setShowAddItemForm(!showAddItemForm)}>
                            <Plus className="h-4 w-4 mr-2" />
                            {showAddItemForm ? 'Cancel' : 'Add Item'}
                        </Button>
                    )}
                    {remainingBalance > 0 && (
                        <Button onClick={() => setShowPaymentForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Payment
                        </Button>
                    )}
                </div>
            </div>

            {/* Print-friendly Invoice Layout */}
            <div className="invoice-print-container print-card bg-white p-8 rounded-lg shadow-sm">
                {/* Invoice Header */}
                <div className="print-section mb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">INVOICE</h1>
                            <div className="text-sm text-gray-600">
                                <p className="font-semibold text-base text-black mb-1">Invoice #{invoice.invoice_no || invoice.id}</p>
                                <p>Date: {safeFormatDate(invoice.invoice_date, "MMMM d, yyyy", "N/A")}</p>
                                {invoice.status && (
                                    <p className="mt-1">
                                        Status: <span className="font-semibold">{invoice.status}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold mb-4">Dive Center</h2>
                            <div className="text-sm text-gray-600">
                                {/* Add dive center info if available */}
                                <p className="text-black font-semibold">SAS Scuba</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer Information */}
                <div className="print-section mb-8 grid grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Bill To:</h3>
                        <div className="text-sm">
                            <p className="font-semibold text-base mb-1">{customerName}</p>
                            {customerEmail && <p>{customerEmail}</p>}
                            {customerPhone && <p>{customerPhone}</p>}
                            {(customerAddress || customerCity || customerZip || customerCountry) && (
                                <div className="mt-2">
                                    {customerAddress && <p>{customerAddress}</p>}
                                    {(customerCity || customerZip || customerCountry) && (
                                        <p>
                                            {[customerCity, customerZip, customerCountry].filter(Boolean).join(', ')}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Invoice Details:</h3>
                        <div className="text-sm space-y-1">
                            <p><span className="font-semibold">Invoice #:</span> {invoice.invoice_no || `#${invoice.id}`}</p>
                            <p><span className="font-semibold">Date:</span> {safeFormatDate(invoice.invoice_date, "MMMM d, yyyy", "N/A")}</p>
                            {invoice.invoice_type && (
                                <p><span className="font-semibold">Type:</span> {invoice.invoice_type}</p>
                            )}
                            {invoice.currency && (
                                <p><span className="font-semibold">Currency:</span> {invoice.currency}</p>
                            )}
                        </div>
                    </div>
                </div>

            {/* Invoice Summary - Hidden in print, shown on screen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Invoice Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">${Number(invoice.total || 0).toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Remaining Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-orange-600">${remainingBalance.toFixed(2)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Invoice Details - Hidden in print */}
            <Card className="no-print mb-6">
                <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
                            <p>{invoice.invoice_no || `#${invoice.id}`}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Invoice Date</label>
                            <p>{safeFormatDate(invoice.invoice_date, "MMM d, yyyy", "N/A")}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <p>{invoice.status}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Type</label>
                            <p>{invoice.invoice_type || 'Full'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Add Item Form */}
            {showAddItemForm && invoice && (
                <div className="no-print mb-6">
                    <AddInvoiceItemForm
                        invoice={invoice}
                        onSuccess={() => {
                            setShowAddItemForm(false);
                            loadInvoice();
                        }}
                        onCancel={() => setShowAddItemForm(false)}
                    />
                </div>
            )}

            {/* Invoice Items */}
            <div className="print-section mb-6">
                <Card className="print-card">
                    <CardHeader className="no-print">
                        <CardTitle>Invoice Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full invoice-items-table">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="text-left p-3 font-semibold">Description</th>
                                        {invoice.status !== 'Paid' && (
                                            <th className="text-center p-3 font-semibold no-print">Actions</th>
                                        )}
                                        <th className="text-right p-3 font-semibold">Quantity</th>
                                        <th className="text-right p-3 font-semibold">Unit Price</th>
                                        <th className="text-right p-3 font-semibold">Discount</th>
                                        <th className="text-right p-3 font-semibold">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!invoice.invoice_items || invoice.invoice_items.length === 0 ? (
                                        <tr>
                                            <td colSpan={invoice.status !== 'Paid' ? 6 : 5} className="text-center p-8 text-muted-foreground">
                                                No items in this invoice. {invoice.status === 'Draft' && 'Click "Add Item" to add items.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        invoice.invoice_items.map((item) => (
                                            <tr key={item.id} className="border-b">
                                                <td className="p-3">{item.description || 'N/A'}</td>
                                                {invoice.status !== 'Paid' && (
                                                    <td className="text-center p-3 no-print">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleDeleteClick(item)}
                                                            title="Remove item"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                )}
                                                <td className="text-right p-3">{item.quantity}</td>
                                                <td className="text-right p-3">${Number(item.unit_price || 0).toFixed(2)}</td>
                                                <td className="text-right p-3">
                                                    {item.discount !== null && item.discount !== undefined && Number(item.discount) > 0 ? (
                                                        <span className="text-red-600">-${Number(item.discount).toFixed(2)}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">$0.00</span>
                                                    )}
                                                </td>
                                                <td className="text-right p-3 font-medium">${Number(item.total || 0).toFixed(2)}</td>
                                            </tr>
                                        ))
                                    )}
                                    <tr className="border-t-2 border-gray-300">
                                        <td colSpan={invoice.status !== 'Paid' ? 5 : 4} className="text-right p-3">Item Total</td>
                                        <td className="text-right p-3">${subtotalBeforeDiscounts > 0 ? subtotalBeforeDiscounts.toFixed(2) : subtotal.toFixed(2)}</td>
                                    </tr>
                                    {discountSum > 0 && (
                                        <tr>
                                            <td colSpan={invoice.status !== 'Paid' ? 5 : 4} className="text-right p-3 text-red-600">Discount</td>
                                            <td className="text-right p-3 text-red-600">(${discountSum.toFixed(2)})</td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td colSpan={invoice.status !== 'Paid' ? 5 : 4} className="text-right p-3">Subtotal After Discount</td>
                                        <td className="text-right p-3">${subtotalAfterDiscount.toFixed(2)}</td>
                                    </tr>
                                    {taxCalculationMode === 'inclusive' ? (
                                        // INCLUSIVE mode: Show breakdown as "Included", don't add to total
                                        <>
                                            {serviceCharge > 0 && (
                                                <tr>
                                                    <td colSpan={invoice.status !== 'Paid' ? 5 : 4} className="text-right p-3 text-muted-foreground">Service Charge (Included)</td>
                                                    <td className="text-right p-3 text-muted-foreground">${serviceCharge.toFixed(2)}</td>
                                                </tr>
                                            )}
                                            {tax > 0 && (
                                                <tr>
                                                    <td colSpan={invoice.status !== 'Paid' ? 5 : 4} className="text-right p-3 text-muted-foreground">T-GST (Included)</td>
                                                    <td className="text-right p-3 text-muted-foreground">${tax.toFixed(2)}</td>
                                                </tr>
                                            )}
                                        </>
                                    ) : (
                                        // EXCLUSIVE mode: Show as additions
                                        <>
                                            {serviceCharge > 0 && (
                                                <tr>
                                                    <td colSpan={invoice.status !== 'Paid' ? 5 : 4} className="text-right p-3">Service Charge</td>
                                                    <td className="text-right p-3">${serviceCharge.toFixed(2)}</td>
                                                </tr>
                                            )}
                                            {subtotalPlusServiceCharge > 0 && (
                                                <tr>
                                                    <td colSpan={invoice.status !== 'Paid' ? 5 : 4} className="text-right p-3">Subtotal + Service Charge</td>
                                                    <td className="text-right p-3">${subtotalPlusServiceCharge.toFixed(2)}</td>
                                                </tr>
                                            )}
                                            {tax > 0 && (
                                                <tr>
                                                    <td colSpan={invoice.status !== 'Paid' ? 5 : 4} className="text-right p-3">T-GST</td>
                                                    <td className="text-right p-3">${tax.toFixed(2)}</td>
                                                </tr>
                                            )}
                                        </>
                                    )}
                                    <tr className="font-bold text-lg border-t-2 border-gray-400">
                                        <td colSpan={invoice.status !== 'Paid' ? 5 : 4} className="text-right p-3">Grand Total</td>
                                        <td className="text-right p-3">${grandTotal.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tax & Service Charge Card */}
            {invoice.status !== 'Paid' && (
                <TaxServiceChargeCard invoice={invoice} onUpdate={loadInvoice} />
            )}

            {/* Payment Summary - Print Version */}
            {payments.length > 0 && (
                <div className="print-section mt-8">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Payment Summary</h3>
                    <div className="text-sm space-y-2 mb-4">
                        <div className="flex justify-between">
                            <span>Total Paid:</span>
                            <span className="font-semibold">${totalPaid.toFixed(2)}</span>
                        </div>
                        {remainingBalance > 0 && (
                            <div className="flex justify-between">
                                <span>Remaining Balance:</span>
                                <span className="font-semibold">${remainingBalance.toFixed(2)}</span>
                            </div>
                        )}
                        {remainingBalance <= 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Status:</span>
                                <span className="font-semibold">Paid in Full</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Payments - Screen Only */}
            <Card className="no-print">
                <CardHeader>
                    <CardTitle>Payments</CardTitle>
                    <CardDescription>Payment history for this invoice</CardDescription>
                </CardHeader>
                <CardContent>
                    {payments.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No payments recorded</p>
                    ) : (
                        <div className="space-y-2">
                            {payments.map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">${Number(payment.amount || 0).toFixed(2)}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {payment.method} • {payment.payment_type}
                                            {payment.payment_date && ` • ${safeFormatDate(payment.payment_date, "MMM d, yyyy", "N/A")}`}
                                        </p>
                                        {payment.reference && (
                                            <p className="text-xs text-muted-foreground">Ref: {payment.reference}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payment Form */}
            {showPaymentForm && invoice && (
                <div className="no-print">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Payment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PaymentForm
                                invoice={invoice}
                                onSuccess={() => {
                                    setShowPaymentForm(false);
                                    loadPayments();
                                    loadInvoice();
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Item</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove "{itemToDelete?.description}" from this invoice? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? "Removing..." : "Remove"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Print Footer */}
            <div className="print-section mt-12 pt-8 border-t border-gray-300 text-xs text-gray-600 text-center">
                <p>Thank you for your business!</p>
                {invoice.invoice_date && (
                    <p className="mt-2">Invoice generated on {safeFormatDate(invoice.invoice_date, "MMMM d, yyyy", "N/A")}</p>
                )}
            </div>
            </div>
            </div>
        </div>
    );
}

