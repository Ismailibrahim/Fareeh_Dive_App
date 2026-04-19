"use client";

import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCommission } from "@/lib/hooks/use-commissions";
import { Skeleton } from "@/components/ui/skeleton";
import { safeFormatDate } from "@/lib/utils/date-format";
import Link from "next/link";
import { ArrowLeft, DollarSign, FileText, User, Calendar, CheckCircle2, XCircle, Clock, Edit } from "lucide-react";
import { CommissionStatusForm } from "@/components/commissions/CommissionStatusForm";
import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function CommissionDetailPage() {
    const params = useParams();
    const commissionId = params.id as string;
    const { data: commission, isLoading, error } = useCommission(commissionId);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Paid':
                return 'default';
            case 'Pending':
                return 'secondary';
            case 'Cancelled':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Paid':
                return <CheckCircle2 className="h-4 w-4" />;
            case 'Pending':
                return <Clock className="h-4 w-4" />;
            case 'Cancelled':
                return <XCircle className="h-4 w-4" />;
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header title="Commission Details" />
                <div className="flex-1 space-y-4 p-8 pt-6">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    if (error || !commission) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header title="Commission Details" />
                <div className="flex-1 space-y-4 p-8 pt-6">
                    <div className="text-center text-muted-foreground">
                        Commission not found
                    </div>
                </div>
            </div>
        );
    }

    const customer = commission.invoice?.customer || commission.invoice?.booking?.customer;

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Commission Details" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <Link href="/dashboard/commissions">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Commissions
                        </Button>
                    </Link>
                    {commission.status !== 'Cancelled' && (
                        <Button onClick={() => setStatusDialogOpen(true)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Update Status
                        </Button>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Commission Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Commission Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge variant={getStatusVariant(commission.status)} className="flex items-center gap-1 w-fit mt-1">
                                        {getStatusIcon(commission.status)}
                                        {commission.status}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Amount</p>
                                    <p className="text-lg font-semibold">
                                        ${parseFloat(commission.commission_amount || '0').toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Calculated At</p>
                                    <p className="text-sm">
                                        {commission.calculated_at
                                            ? safeFormatDate(commission.calculated_at)
                                            : 'N/A'}
                                    </p>
                                </div>
                                {commission.paid_at && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Paid At</p>
                                        <p className="text-sm">
                                            {safeFormatDate(commission.paid_at)}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {commission.notes && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Notes</p>
                                    <p className="text-sm">{commission.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Information */}
                    {commission.status === 'Paid' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Payment Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {commission.payment_method && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Payment Method</p>
                                        <p className="text-sm">
                                            {commission.payment_method.name} ({commission.payment_method.method_type})
                                        </p>
                                    </div>
                                )}
                                {commission.payment_reference && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Payment Reference</p>
                                        <p className="text-sm">{commission.payment_reference}</p>
                                    </div>
                                )}
                                {commission.payment_notes && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Payment Notes</p>
                                        <p className="text-sm">{commission.payment_notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Agent Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Agent Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {commission.agent ? (
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Agent Name</p>
                                        <Link
                                            href={`/dashboard/agents/${commission.agent_id}`}
                                            className="text-sm font-medium text-blue-600 hover:underline"
                                        >
                                            {commission.agent.name}
                                        </Link>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Agent Type</p>
                                        <p className="text-sm">{commission.agent.agent_type}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No agent information</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Invoice Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Invoice Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {commission.invoice ? (
                                <>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Invoice Number</p>
                                        <Link
                                            href={`/dashboard/invoices/${commission.invoice_id}`}
                                            className="text-sm font-medium text-blue-600 hover:underline"
                                        >
                                            {commission.invoice.invoice_no || 'N/A'}
                                        </Link>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Invoice Date</p>
                                        <p className="text-sm">
                                            {commission.invoice.invoice_date
                                                ? safeFormatDate(commission.invoice.invoice_date)
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Invoice Total</p>
                                        <p className="text-sm">
                                            ${parseFloat(commission.invoice.total || '0').toFixed(2)}
                                        </p>
                                    </div>
                                    {customer && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Customer</p>
                                            <Link
                                                href={`/dashboard/customers/${customer.id}`}
                                                className="text-sm font-medium text-blue-600 hover:underline"
                                            >
                                                {customer.first_name} {customer.last_name}
                                            </Link>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">No invoice information</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Calculation Breakdown (if available) */}
                {commission.invoice?.invoiceItems && commission.invoice.invoiceItems.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice Items</CardTitle>
                            <CardDescription>
                                Items included in the commission calculation
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {commission.invoice.invoiceItems.map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.name || item.description || 'N/A'}</TableCell>
                                            <TableCell>{item.quantity || 1}</TableCell>
                                            <TableCell>${parseFloat(item.price || '0').toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                ${parseFloat(item.total || item.price || '0').toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Status Update Dialog */}
            {commission && (
                <CommissionStatusForm
                    commission={commission}
                    open={statusDialogOpen}
                    onOpenChange={setStatusDialogOpen}
                    onSuccess={() => {
                        setStatusDialogOpen(false);
                    }}
                />
            )}
        </div>
    );
}
