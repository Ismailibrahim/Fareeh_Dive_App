"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { bookingService, Booking } from "@/lib/api/services/booking.service";
import { invoiceService, Invoice } from "@/lib/api/services/invoice.service";
import { InvoiceGenerationDialog } from "@/components/invoices/InvoiceGenerationDialog";
import {
    ArrowLeft, FileText, Plus, Calendar, User, Hash,
    CreditCard, CheckCircle2, AlertCircle, Clock, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { safeFormatDate } from "@/lib/utils/date-format";

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    Pending:   { color: "bg-yellow-100 text-yellow-800 border-yellow-200",  icon: <Clock className="h-3 w-3" /> },
    Confirmed: { color: "bg-blue-100 text-blue-800 border-blue-200",        icon: <CheckCircle2 className="h-3 w-3" /> },
    Completed: { color: "bg-green-100 text-green-800 border-green-200",     icon: <CheckCircle2 className="h-3 w-3" /> },
    Cancelled: { color: "bg-red-100 text-red-800 border-red-200",           icon: <AlertCircle className="h-3 w-3" /> },
};

const invoiceStatusConfig: Record<string, string> = {
    Draft:     "bg-slate-100 text-slate-700 border-slate-200",
    Sent:      "bg-blue-100 text-blue-700 border-blue-200",
    Paid:      "bg-green-100 text-green-700 border-green-200",
    Partial:   "bg-amber-100 text-amber-700 border-amber-200",
    Overdue:   "bg-red-100 text-red-700 border-red-200",
    Cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

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
            const bookingInvoices = await invoiceService.getByBookingId(Number(bookingId));
            setInvoices(bookingInvoices);
        } catch (error) {
            console.error("Failed to load invoices", error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">Booking not found</p>
                <Link href="/dashboard/bookings">
                    <Button variant="outline">Back to Bookings</Button>
                </Link>
            </div>
        );
    }

    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => {
        const paid = inv.payments?.reduce((pSum, p) => pSum + Number(p.amount || 0), 0) || 0;
        return sum + paid;
    }, 0);
    const remainingBalance = totalInvoiced - totalPaid;

    const statusCfg = statusConfig[booking.status] ?? { color: "bg-slate-100 text-slate-700 border-slate-200", icon: null };

    return (
        <div className="space-y-6 max-w-5xl mx-auto px-6 pt-6 pb-10">
            {/* Page Header */}
            <div>
                <Link
                    href="/dashboard/bookings"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Bookings
                </Link>

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold tracking-tight">Booking #{booking.id}</h1>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusCfg.color}`}>
                                {statusCfg.icon}
                                {booking.status}
                            </span>
                        </div>
                        <p className="text-muted-foreground">
                            {booking.customer?.full_name || "Unknown Customer"}
                        </p>
                    </div>
                    <Button onClick={() => setShowInvoiceDialog(true)} className="shrink-0">
                        <Plus className="h-4 w-4 mr-2" />
                        Generate Invoice
                    </Button>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1.5">
                        <Hash className="h-3.5 w-3.5" />
                        Booking ID
                    </div>
                    <p className="text-lg font-semibold">#{booking.id}</p>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Booking Date
                    </div>
                    <p className="text-lg font-semibold">
                        {safeFormatDate(booking.booking_date, "MMM d, yyyy", "N/A")}
                    </p>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1.5">
                        <User className="h-3.5 w-3.5" />
                        Customer
                    </div>
                    <p className="text-lg font-semibold truncate">
                        {booking.customer?.full_name || "N/A"}
                    </p>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1.5">
                        <User className="h-3.5 w-3.5" />
                        Divers
                    </div>
                    <p className="text-lg font-semibold">
                        {booking.number_of_divers || "N/A"}
                    </p>
                </Card>
            </div>

            {/* Notes */}
            {booking.notes && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{booking.notes}</p>
                    </CardContent>
                </Card>
            )}

            {/* Invoices Section */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-base">Invoices</CardTitle>
                            {invoices.length > 0 && (
                                <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                                    {invoices.length}
                                </span>
                            )}
                        </div>
                    </div>
                </CardHeader>

                {/* Finance Summary */}
                {invoices.length > 0 && (
                    <>
                        <div className="px-6 pb-4">
                            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-xl border">
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Total Invoiced</p>
                                    <p className="text-xl font-bold">${totalInvoiced.toFixed(2)}</p>
                                </div>
                                <div className="text-center border-x">
                                    <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Total Paid</p>
                                    <p className="text-xl font-bold text-emerald-600">${totalPaid.toFixed(2)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Remaining</p>
                                    <p className={`text-xl font-bold ${remainingBalance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                                        ${remainingBalance.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Separator />
                    </>
                )}

                <CardContent className="pt-4">
                    {invoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                            <CreditCard className="h-10 w-10 opacity-30" />
                            <p className="text-sm">No invoices yet for this booking.</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowInvoiceDialog(true)}
                            >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Generate First Invoice
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {invoices.map((invoice) => {
                                const invoicePaid = invoice.payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
                                const invoiceRemaining = Number(invoice.total || 0) - invoicePaid;
                                const statusClass = invoiceStatusConfig[invoice.status] ?? "bg-slate-100 text-slate-700 border-slate-200";

                                return (
                                    <Link
                                        key={invoice.id}
                                        href={`/dashboard/invoices/${invoice.id}`}
                                        className="flex items-center justify-between p-4 rounded-xl border hover:border-primary/40 hover:bg-muted/30 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                <FileText className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold group-hover:text-primary transition-colors">
                                                    {invoice.invoice_no || `Invoice #${invoice.id}`}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusClass}`}>
                                                        {invoice.status}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {invoice.invoice_type || "Full"}
                                                    </span>
                                                    {invoice.invoice_date && (
                                                        <span className="text-xs text-muted-foreground">
                                                            • {safeFormatDate(invoice.invoice_date, "MMM d, yyyy", "N/A")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 shrink-0">
                                            <div className="text-right">
                                                <p className="font-bold text-base">${Number(invoice.total || 0).toFixed(2)}</p>
                                                {invoiceRemaining > 0 ? (
                                                    <p className="text-xs text-amber-600">
                                                        Due: ${invoiceRemaining.toFixed(2)}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-emerald-600">Paid in full</p>
                                                )}
                                            </div>
                                            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                    </Link>
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
