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
import { HandCoins, DollarSign, Search, Download, Eye, CheckCircle2, Clock, Building2 } from "lucide-react";
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

export default function CommissionPayablePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [agentFilter, setAgentFilter] = useState<string>("all");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    const debouncedSearch = useDebouncedCallback((value: string) => {
        setDebouncedSearchTerm(value);
        setCurrentPage(1);
    }, 500);

    const filterParams = useMemo(() => ({
        page: currentPage,
        per_page: 20,
        status: 'Pending' as const,
        search: debouncedSearchTerm || undefined,
        agent_id: agentFilter !== "all" ? parseInt(agentFilter) : undefined,
    }), [currentPage, debouncedSearchTerm, agentFilter]);

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

    // Group commissions by agent
    const commissionsByAgent = useMemo(() => {
        const grouped: Record<number, { agent: any; commissions: AgentCommission[]; total: number }> = {};
        
        commissions.forEach((commission) => {
            if (!commission.agent_id || !commission.agent) return;
            
            const agentId = commission.agent_id;
            if (!grouped[agentId]) {
                grouped[agentId] = {
                    agent: commission.agent,
                    commissions: [],
                    total: 0,
                };
            }
            
            grouped[agentId].commissions.push(commission);
            grouped[agentId].total += parseFloat(commission.commission_amount || '0');
        });
        
        return Object.values(grouped);
    }, [commissions]);

    // Calculate overall totals
    const summaryStats = useMemo(() => {
        const totalPayable = commissions.reduce((sum, c) => sum + parseFloat(c.commission_amount || '0'), 0);
        const agentCount = new Set(commissions.map(c => c.agent_id)).size;
        
        return { totalPayable, agentCount, commissionCount: commissions.length };
    }, [commissions]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Paid':
                return <CheckCircle2 className="h-4 w-4" />;
            case 'Pending':
                return <Clock className="h-4 w-4" />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Commission Payable Report" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Commission Payable Report</h2>
                        <p className="text-muted-foreground">
                            All pending commissions grouped by agent
                        </p>
                    </div>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Payable</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${summaryStats.totalPayable.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Across {summaryStats.agentCount} agent(s)
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Commissions</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryStats.commissionCount}</div>
                            <p className="text-xs text-muted-foreground">
                                Total pending commissions
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Agents</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryStats.agentCount}</div>
                            <p className="text-xs text-muted-foreground">
                                Agents with pending commissions
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by invoice number or customer name..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        debouncedSearch(e.target.value);
                                    }}
                                />
                            </div>
                            <Select value={agentFilter} onValueChange={setAgentFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Agents" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Agents</SelectItem>
                                    {commissionsByAgent.map((group) => (
                                        <SelectItem key={group.agent.id} value={group.agent.id.toString()}>
                                            {group.agent.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Commissions by Agent */}
                {isLoading ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Commissions by Agent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="h-6 w-48" />
                                        <Skeleton className="h-32 w-full" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ) : commissionsByAgent.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Commissions by Agent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center text-muted-foreground py-8">
                                No pending commissions found
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {commissionsByAgent.map((group) => (
                            <Card key={group.agent.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Building2 className="h-5 w-5" />
                                                {group.agent.name}
                                            </CardTitle>
                                            <CardDescription>
                                                {group.commissions.length} pending commission(s)
                                            </CardDescription>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold">
                                                ${group.total.toFixed(2)}
                                            </div>
                                            <p className="text-xs text-muted-foreground">Total Payable</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Invoice</TableHead>
                                                    <TableHead>Customer</TableHead>
                                                    <TableHead>Amount</TableHead>
                                                    <TableHead>Calculated</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {group.commissions.map((commission) => {
                                                    const customer = commission.invoice?.customer || commission.invoice?.booking?.customer;
                                                    return (
                                                        <TableRow key={commission.id}>
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
                                                                {commission.calculated_at
                                                                    ? safeFormatDate(commission.calculated_at)
                                                                    : 'N/A'}
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
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* All Commissions Table (Alternative View) */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Pending Commissions</CardTitle>
                        <CardDescription>
                            Showing {commissions.length} of {pagination.total} pending commissions
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
                                                <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : commissions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                                                No pending commissions found
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
                                                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                                            {getStatusIcon(commission.status)}
                                                            {commission.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {commission.calculated_at
                                                            ? safeFormatDate(commission.calculated_at)
                                                            : 'N/A'}
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
