"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { bookingService, Booking } from "@/lib/api/services/booking.service";
import { invoiceService, Invoice } from "@/lib/api/services/invoice.service";
import { InvoiceGenerationDialog } from "@/components/invoices/InvoiceGenerationDialog";
import { ArrowLeft, FileText, DollarSign, Plus, Calendar, User } from "lucide-react";
import Link from "next/link";
import { safeFormatDate } from "@/lib/utils/date-format";

export default function BookingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params.id as string;
    const [booking, setBooking] = useState<Booking | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

    useEffect(() => {
        if (bookingId) {
            loadBooking();
            loadInvoices();
        }
    }, [bookingId]);

    const loadBooking = async () => {
        try {
            const data = await bookingService.getById(bookingId);
            setBooking(data);
        } catch (error) {
            console.error("Failed to load booking", error);
        } finally {
            setLoading(false);
        }
    };

    const loadInvoices = async () => {
        try {
            const data = await invoiceService.getAll({}, 1);
            const invoiceList = Array.isArray(data) ? data : (data as any).data || [];
            // Filter invoices for this booking
            const bookingInvoices = invoiceList.filter((inv: Invoice) => inv.booking_id === Number(bookingId));
            setInvoices(bookingInvoices);
        } catch (error) {
            console.error("Failed to load invoices", error);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading booking...</div>;
    }

    if (!booking) {
        return <div className="text-center py-8">Booking not found</div>;
    }

    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => {
        const paid = inv.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0;
        return sum + paid;
    }, 0);
    const remainingBalance = totalInvoiced - totalPaid;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/dashboard/bookings" className="text-sm text-muted-foreground hover:underline mb-2 block flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Bookings
                    </Link>
                    <h1 className="text-3xl font-bold">Booking #{booking.id}</h1>
                    <p className="text-muted-foreground">
                        {booking.customer?.full_name || 'Unknown Customer'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href={`/dashboard/bookings/${bookingId}/edit`}>
                        <Button variant="outline">Edit</Button>
                    </Link>
                    <Button onClick={() => setShowInvoiceDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Generate Invoice
                    </Button>
                </div>
            </div>

            {/* Booking Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Booking Date
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg">
                            {safeFormatDate(booking.booking_date, "MMM d, yyyy", "N/A")}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">{booking.status}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Number of Divers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg">{booking.number_of_divers || 'N/A'}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Booking Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Booking Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Customer</label>
                            <p>{booking.customer?.full_name || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <p>{booking.status}</p>
                        </div>
                        {booking.notes && (
                            <div className="col-span-2">
                                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                                <p className="mt-1">{booking.notes}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Invoices Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Invoices
                    </CardTitle>
                    <CardDescription>Invoices and payments for this booking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Invoice Summary */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Total Invoiced</label>
                            <p className="text-lg font-semibold">${totalInvoiced.toFixed(2)}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Total Paid</label>
                            <p className="text-lg font-semibold text-green-600">${totalPaid.toFixed(2)}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Remaining Balance</label>
                            <p className="text-lg font-semibold text-orange-600">${remainingBalance.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Invoice List */}
                    {invoices.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No invoices yet</p>
                    ) : (
                        <div className="space-y-2">
                            {invoices.map((invoice) => {
                                const invoicePaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                                const invoiceRemaining = (invoice.total || 0) - invoicePaid;

                                return (
                                    <div key={invoice.id} className="p-4 border rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Link
                                                    href={`/dashboard/invoices/${invoice.id}`}
                                                    className="font-medium hover:underline"
                                                >
                                                    {invoice.invoice_no || `Invoice #${invoice.id}`}
                                                </Link>
                                                <p className="text-sm text-muted-foreground">
                                                    {invoice.invoice_type || 'Full'} • {invoice.status}
                                                    {invoice.invoice_date && ` • ${safeFormatDate(invoice.invoice_date, "MMM d, yyyy", "N/A")}`}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">${Number(invoice.total || 0).toFixed(2)}</p>
                                                {invoiceRemaining > 0 && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Remaining: ${Number(invoiceRemaining || 0).toFixed(2)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Invoice Generation Dialog */}
            <InvoiceGenerationDialog
                open={showInvoiceDialog}
                onOpenChange={setShowInvoiceDialog}
                bookingId={Number(bookingId)}
                onSuccess={() => {
                    loadInvoices();
                    loadBooking();
                }}
            />
        </div>
    );
}

