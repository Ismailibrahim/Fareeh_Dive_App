"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { invoiceService, Invoice } from "@/lib/api/services/invoice.service";
import { useRouter } from "next/navigation";
import { Plus, FileText, DollarSign } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function InvoicesPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<{ status?: string; invoice_type?: string }>({});

    useEffect(() => {
        loadInvoices();
    }, [filters]);

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const data = await invoiceService.getAll(filters);
            const invoiceList = Array.isArray(data) ? data : (data as any).data || [];
            setInvoices(invoiceList);
        } catch (error) {
            console.error("Failed to load invoices", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Paid':
                return 'bg-green-100 text-green-800';
            case 'Partially Paid':
                return 'bg-yellow-100 text-yellow-800';
            case 'Draft':
                return 'bg-gray-100 text-gray-800';
            case 'Refunded':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Invoices</h1>
                    <p className="text-muted-foreground">Manage customer invoices and payments</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <select
                            className="px-3 py-2 border rounded-md"
                            value={filters.status || ''}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                        >
                            <option value="">All Statuses</option>
                            <option value="Draft">Draft</option>
                            <option value="Paid">Paid</option>
                            <option value="Partially Paid">Partially Paid</option>
                            <option value="Refunded">Refunded</option>
                        </select>
                        <select
                            className="px-3 py-2 border rounded-md"
                            value={filters.invoice_type || ''}
                            onChange={(e) => setFilters({ ...filters, invoice_type: e.target.value || undefined })}
                        >
                            <option value="">All Types</option>
                            <option value="Full">Full</option>
                            <option value="Advance">Advance</option>
                            <option value="Final">Final</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Invoices List */}
            {loading ? (
                <div className="text-center py-8">Loading invoices...</div>
            ) : invoices.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No invoices found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {invoices.map((invoice) => {
                        const totalPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                        const remaining = invoice.total - totalPaid;

                        return (
                            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    href={`/dashboard/invoices/${invoice.id}`}
                                                    className="font-semibold text-lg hover:underline"
                                                >
                                                    {invoice.invoice_no || `Invoice #${invoice.id}`}
                                                </Link>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                                    {invoice.status}
                                                </span>
                                                {invoice.invoice_type && (
                                                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                                        {invoice.invoice_type}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {invoice.booking?.customer?.full_name || 'Unknown Customer'}
                                            </p>
                                            {invoice.invoice_date && (
                                                <p className="text-sm text-muted-foreground">
                                                    {format(new Date(invoice.invoice_date), "MMM d, yyyy")}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-lg font-semibold">${invoice.total.toFixed(2)}</p>
                                            {remaining > 0 && (
                                                <p className="text-sm text-muted-foreground">
                                                    Remaining: ${remaining.toFixed(2)}
                                                </p>
                                            )}
                                            {totalPaid > 0 && (
                                                <p className="text-sm text-green-600">
                                                    Paid: ${totalPaid.toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

