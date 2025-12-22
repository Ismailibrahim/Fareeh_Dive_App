"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { invoiceService, Invoice } from "@/lib/api/services/invoice.service";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { FileText, MoreHorizontal, Eye, Calendar, Plus } from "lucide-react";
import Link from "next/link";
import { safeFormatDate } from "@/lib/utils/date-format";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function InvoicesPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<{ status?: string; invoice_type?: string }>({});
    const [showCreateDialog, setShowCreateDialog] = useState(false);

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

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Paid':
                return 'default';
            case 'Partially Paid':
                return 'secondary';
            case 'Draft':
                return 'outline';
            case 'Refunded':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Invoices" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
                    <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Invoice
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 flex-wrap">
                    <Select
                        value={filters.status || 'all'}
                        onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                            <SelectItem value="Refunded">Refunded</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.invoice_type || 'all'}
                        onValueChange={(value) => setFilters({ ...filters, invoice_type: value === 'all' ? undefined : value })}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="Full">Full</SelectItem>
                            <SelectItem value="Advance">Advance</SelectItem>
                            <SelectItem value="Final">Final</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Desktop Table View */}
                <div className="rounded-md border hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice No</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Paid</TableHead>
                                <TableHead>Remaining</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center">
                                        No invoices found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((invoice) => {
                                    const totalPaid = invoice.payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
                                    const invoiceTotal = Number(invoice.total || 0);
                                    const remaining = invoiceTotal - totalPaid;

                                    return (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={`/dashboard/invoices/${invoice.id}`}
                                                    className="hover:underline flex items-center gap-2"
                                                >
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    {invoice.invoice_no || `Invoice #${invoice.id}`}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                {invoice.booking?.customer?.full_name || invoice.customer?.full_name || 'Unknown Customer'}
                                            </TableCell>
                                            <TableCell>
                                                {invoice.invoice_date ? (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {safeFormatDate(invoice.invoice_date, "MMM d, yyyy", "-")}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {invoice.invoice_type ? (
                                                    <Badge variant="outline">{invoice.invoice_type}</Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(invoice.status)}>
                                                    {invoice.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                ${Number(invoice.total || 0).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                {totalPaid > 0 ? (
                                                    <span className="text-green-600 font-medium">
                                                        ${totalPaid.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">$0.00</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {remaining > 0 ? (
                                                    <span className="text-muted-foreground">
                                                        ${remaining.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-green-600 font-medium">$0.00</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                router.push(`/dashboard/invoices/${invoice.id}`);
                                                            }}
                                                            className="cursor-pointer"
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {loading ? (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">Loading...</p>
                            </CardContent>
                        </Card>
                    ) : invoices.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No invoices found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        invoices.map((invoice) => {
                            const totalPaid = invoice.payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
                            const invoiceTotal = Number(invoice.total || 0);
                            const remaining = invoiceTotal - totalPaid;

                            return (
                                <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2 flex-1">
                                                <Link
                                                    href={`/dashboard/invoices/${invoice.id}`}
                                                    className="font-semibold text-lg hover:underline flex items-center gap-2"
                                                >
                                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                                    {invoice.invoice_no || `Invoice #${invoice.id}`}
                                                </Link>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant={getStatusVariant(invoice.status)}>
                                                        {invoice.status}
                                                    </Badge>
                                                    {invoice.invoice_type && (
                                                        <Badge variant="outline">{invoice.invoice_type}</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <CardDescription className="mb-1">Customer</CardDescription>
                                            <p className="font-medium">
                                                {invoice.booking?.customer?.full_name || invoice.customer?.full_name || 'Unknown Customer'}
                                            </p>
                                        </div>
                                        {invoice.invoice_date && (
                                            <div>
                                                <CardDescription className="mb-1 flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    Invoice Date
                                                </CardDescription>
                                                <p className="text-sm">
                                                    {safeFormatDate(invoice.invoice_date, "MMM d, yyyy", "-")}
                                                </p>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <CardDescription className="mb-1">Total</CardDescription>
                                                <p className="font-semibold">${Number(invoice.total || 0).toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <CardDescription className="mb-1">Paid</CardDescription>
                                                <p className="font-medium text-green-600">
                                                    ${totalPaid.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        {remaining > 0 && (
                                            <div>
                                                <CardDescription className="mb-1">Remaining</CardDescription>
                                                <p className="font-medium text-muted-foreground">
                                                    ${remaining.toFixed(2)}
                                                </p>
                                            </div>
                                        )}
                                        <div className="pt-2">
                                            <Link href={`/dashboard/invoices/${invoice.id}`}>
                                                <Button variant="outline" className="w-full">
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Create Invoice Dialog */}
                <CreateInvoiceDialog
                    open={showCreateDialog}
                    onOpenChange={setShowCreateDialog}
                    onSuccess={() => {
                        loadInvoices();
                    }}
                />
            </div>
        </div>
    );
}

