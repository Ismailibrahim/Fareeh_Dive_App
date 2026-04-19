"use client";

import { useState, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCommissions } from "@/lib/hooks/use-commissions";
import { safeFormatDate } from "@/lib/utils/date-format";
import Link from "next/link";
import { HandCoins, DollarSign, Search, Download, Eye, CheckCircle2, XCircle, Clock } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { AgentCommission } from "@/lib/api/services/commission.service";

export default function CommissionHistoryPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    const debouncedSearch = useDebouncedCallback((value: string) => {
        setDebouncedSearchTerm(value);
        setCurrentPage(1);
    }, 500);

    const filterParams = useMemo(() => ({
        page: currentPage,
        per_page: 20,
        search: debouncedSearchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter as 'Pending' | 'Paid' | 'Cancelled' : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
    }), [currentPage, debouncedSearchTerm, statusFilter, dateFrom, dateTo]);

    const { data: commissionsData, isLoading } = useCommissions(filterParams);

    const commissions = commissionsData?.data || [];

    const pagination = useMemo(() => {
        if (!commissionsData) {
            return {
                total: 0,
                per_page: 20,
                last_page: 1,
                current_page: 1,
            };
        }
        return {
            total: commissionsData.total || 0,
            per_page: commissionsData.per_page || 20,
            last_page: commissionsData.last_page || 1,
            current_page: commissionsData.current_page || currentPage,
        };
    }, [commissionsData, currentPage]);

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

    // Calculate summary stats
    const summaryStats = useMemo(() => {
        const pending = commissions.filter(c => c.status === 'Pending').length;
        const paid = commissions.filter(c => c.status === 'Paid').length;
        const cancelled = commissions.filter(c => c.status === 'Cancelled').length;
        const totalAmount = commissions.reduce((sum, c) => sum + parseFloat(c.commission_amount || '0'), 0);
        const paidAmount = commissions
            .filter(c => c.status === 'Paid')
            .reduce((sum, c) => sum + parseFloat(c.commission_amount || '0'), 0);

        return { pending, paid, cancelled, totalAmount, paidAmount };
    }, [commissions]);

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Commission History Report" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Commission History</h2>
                        <p className="text-muted-foreground">
                            Historical commission records and analytics
                        </p>
                    </div>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
                            <HandCoins className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{commissions.length}</div>
                            <p className="text-xs text-muted-foreground">
                                ${summaryStats.totalAmount.toFixed(2)} total
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Paid</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryStats.paid}</div>
                            <p className="text-xs text-muted-foreground">
                                ${summaryStats.paidAmount.toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryStats.pending}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryStats.cancelled}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        debouncedSearch(e.target.value);
                                    }}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Paid">Paid</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="date"
                                placeholder="Date From"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                            <Input
                                type="date"
                                placeholder="Date To"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Commissions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Commissions</CardTitle>
                        <CardDescription>
                            Showing {commissions.length} of {pagination.total} commissions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Agent</TableHead>
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Calculated</TableHead>
                                        <TableHead>Paid</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : commissions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center text-muted-foreground">
                                                No commissions found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        commissions.map((commission) => {
                                            const customer = commission.invoice?.customer || commission.invoice?.booking?.customer;
                                            return (
                                                <TableRow key={commission.id}>
                                                    <TableCell className="font-medium">
                                                        {commission.agent?.name || 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Link
                                                            href={`/dashboard/invoices/${commission.invoice_id}`}
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            {commission.invoice?.invoice_no || 'N/A'}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        {customer
                                                            ? `${customer.first_name} ${customer.last_name}`
                                                            : 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                            {parseFloat(commission.commission_amount || '0').toFixed(2)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={getStatusVariant(commission.status)} className="flex items-center gap-1 w-fit">
                                                            {getStatusIcon(commission.status)}
                                                            {commission.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {commission.calculated_at
                                                            ? safeFormatDate(commission.calculated_at)
                                                            : 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {commission.paid_at
                                                            ? safeFormatDate(commission.paid_at)
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Link href={`/dashboard/commissions/${commission.id}`}>
                                                            <Button variant="ghost" size="sm">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {pagination.last_page > 1 && (
                            <div className="flex justify-center mt-4">
                                <Pagination
                                    currentPage={pagination.current_page}
                                    totalPages={pagination.last_page}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
