"use client";

import { useState, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Header } from "@/components/layout/Header";
import { Pagination } from "@/components/ui/pagination";
import { useCommissions } from "@/lib/hooks/use-commissions";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MoreHorizontal, DollarSign, Eye, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { safeFormatDate } from "@/lib/utils/date-format";
import { AgentCommission } from "@/lib/api/services/commission.service";
import { CommissionStatusForm } from "@/components/commissions/CommissionStatusForm";

export default function CommissionsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectedCommission, setSelectedCommission] = useState<AgentCommission | null>(null);

    // Debounce search term (500ms delay)
    const debouncedSearch = useDebouncedCallback((value: string) => {
        setDebouncedSearchTerm(value);
        setCurrentPage(1); // Reset to first page on new search
    }, 500);

    // Build filter params
    const filterParams = useMemo(() => ({
        page: currentPage,
        per_page: 20,
        search: debouncedSearchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter as 'Pending' | 'Paid' | 'Cancelled' : undefined,
    }), [currentPage, debouncedSearchTerm, statusFilter]);

    // Fetch commissions using React Query
    const { data: commissionsData, isLoading, error } = useCommissions(filterParams);

    // Extract commissions and pagination from response
    const commissions = useMemo(() => {
        if (!commissionsData) return [];
        return commissionsData.data || [];
    }, [commissionsData]);

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

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        debouncedSearch(value);
    };

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
        const totalAmount = commissions.reduce((sum, c) => sum + parseFloat(c.commission_amount || '0'), 0);
        const pendingAmount = commissions
            .filter(c => c.status === 'Pending')
            .reduce((sum, c) => sum + parseFloat(c.commission_amount || '0'), 0);

        return { pending, paid, totalAmount, pendingAmount };
    }, [commissions]);

    const handleStatusUpdate = (commission: AgentCommission) => {
        setSelectedCommission(commission);
        setStatusDialogOpen(true);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Commissions" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Commissions</h2>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryStats.pending}</div>
                            <p className="text-xs text-muted-foreground">
                                ${summaryStats.pendingAmount.toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryStats.paid}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${summaryStats.totalAmount.toFixed(2)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{commissions.length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by invoice number or customer name..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Commissions Table */}
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
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                                        Failed to load commissions
                                    </TableCell>
                                </TableRow>
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
                                                ${parseFloat(commission.commission_amount || '0').toFixed(2)}
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
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/dashboard/commissions/${commission.id}`}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {commission.status !== 'Cancelled' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleStatusUpdate(commission)}
                                                            >
                                                                <Calendar className="mr-2 h-4 w-4" />
                                                                Update Status
                                                            </DropdownMenuItem>
                                                        )}
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

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="flex justify-center">
                        <Pagination
                            currentPage={pagination.current_page}
                            totalPages={pagination.last_page}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* Status Update Dialog */}
            {selectedCommission && (
                <CommissionStatusForm
                    commission={selectedCommission}
                    open={statusDialogOpen}
                    onOpenChange={setStatusDialogOpen}
                    onSuccess={() => {
                        setStatusDialogOpen(false);
                        setSelectedCommission(null);
                    }}
                />
            )}
        </div>
    );
}
