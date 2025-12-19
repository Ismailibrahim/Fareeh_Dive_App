"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { invoiceService, Invoice } from "@/lib/api/services/invoice.service";
import { paymentService, Payment } from "@/lib/api/services/payment.service";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { InvoiceGenerationDialog } from "@/components/invoices/InvoiceGenerationDialog";
import { DollarSign, FileText, Plus, Printer } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const invoiceId = params.id as string;
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    useEffect(() => {
        if (invoiceId) {
            loadInvoice();
            loadPayments();
        }
    }, [invoiceId]);

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

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = invoice ? invoice.total - totalPaid : 0;

    if (loading) {
        return <div className="text-center py-8">Loading invoice...</div>;
    }

    if (!invoice) {
        return <div className="text-center py-8">Invoice not found</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/dashboard/invoices" className="text-sm text-muted-foreground hover:underline mb-2 block">
                        ← Back to Invoices
                    </Link>
                    <h1 className="text-3xl font-bold">
                        {invoice.invoice_no || `Invoice #${invoice.id}`}
                    </h1>
                    <p className="text-muted-foreground">
                        {invoice.booking?.customer?.full_name || 'Unknown Customer'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                    {remainingBalance > 0 && (
                        <Button onClick={() => setShowPaymentForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Payment
                        </Button>
                    )}
                </div>
            </div>

            {/* Invoice Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Invoice Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">${invoice.total.toFixed(2)}</p>
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

            {/* Invoice Details */}
            <Card>
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
                            <p>{invoice.invoice_date ? format(new Date(invoice.invoice_date), "MMM d, yyyy") : 'N/A'}</p>
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

            {/* Invoice Items */}
            <Card>
                <CardHeader>
                    <CardTitle>Invoice Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2">Description</th>
                                    <th className="text-right p-2">Quantity</th>
                                    <th className="text-right p-2">Unit Price</th>
                                    <th className="text-right p-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.invoice_items?.map((item) => (
                                    <tr key={item.id} className="border-b">
                                        <td className="p-2">{item.description || 'N/A'}</td>
                                        <td className="text-right p-2">{item.quantity}</td>
                                        <td className="text-right p-2">${item.unit_price.toFixed(2)}</td>
                                        <td className="text-right p-2">${item.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                                <tr className="font-semibold">
                                    <td colSpan={3} className="text-right p-2">Subtotal</td>
                                    <td className="text-right p-2">${invoice.subtotal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="text-right p-2">Tax</td>
                                    <td className="text-right p-2">${invoice.tax.toFixed(2)}</td>
                                </tr>
                                <tr className="font-bold text-lg">
                                    <td colSpan={3} className="text-right p-2">Total</td>
                                    <td className="text-right p-2">${invoice.total.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Payments */}
            <Card>
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
                                        <p className="font-medium">${payment.amount.toFixed(2)}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {payment.method} • {payment.payment_type}
                                            {payment.payment_date && ` • ${format(new Date(payment.payment_date), "MMM d, yyyy")}`}
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
            )}
        </div>
    );
}

