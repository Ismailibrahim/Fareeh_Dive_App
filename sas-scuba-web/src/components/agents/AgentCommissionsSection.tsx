"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { HandCoins, ChevronDown, Plus, Eye, CheckCircle2, XCircle, Clock, DollarSign } from "lucide-react";
import { AgentCommission } from "@/lib/api/services/commission.service";
import { useCommissions, useCalculateCommissions } from "@/lib/hooks/use-commissions";
import { safeFormatDate } from "@/lib/utils/date-format";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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

interface AgentCommissionsSectionProps {
    agentId: number | string;
}

export function AgentCommissionsSection({ agentId }: AgentCommissionsSectionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [calculateDialogOpen, setCalculateDialogOpen] = useState(false);
    
    const { data: commissionsData, isLoading } = useCommissions({
        agent_id: typeof agentId === 'string' ? parseInt(agentId) : agentId,
        per_page: 10,
    });
    
    const calculateMutation = useCalculateCommissions();

    const commissions = commissionsData?.data || [];

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
    const summaryStats = {
        pending: commissions.filter(c => c.status === 'Pending').length,
        paid: commissions.filter(c => c.status === 'Paid').length,
        totalAmount: commissions.reduce((sum, c) => sum + parseFloat(c.commission_amount || '0'), 0),
        pendingAmount: commissions
            .filter(c => c.status === 'Pending')
            .reduce((sum, c) => sum + parseFloat(c.commission_amount || '0'), 0),
    };

    const handleCalculateCommissions = async () => {
        try {
            await calculateMutation.mutateAsync({
                agentId: typeof agentId === 'string' ? parseInt(agentId) : agentId,
            });
            setCalculateDialogOpen(false);
        } catch (error) {
            console.error("Failed to calculate commissions", error);
        }
    };

    return (
        <>
            <Card>
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <HandCoins className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-xl">Commissions</CardTitle>
                                </div>
                                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                            </div>
                            <CardDescription>
                                Commission history and payment tracking
                            </CardDescription>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="space-y-4">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Pending</p>
                                    <p className="text-2xl font-bold">{summaryStats.pending}</p>
                                    <p className="text-xs text-muted-foreground">
                                        ${summaryStats.pendingAmount.toFixed(2)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Paid</p>
                                    <p className="text-2xl font-bold">{summaryStats.paid}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Total Amount</p>
                                    <p className="text-2xl font-bold">${summaryStats.totalAmount.toFixed(2)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Total Commissions</p>
                                    <p className="text-2xl font-bold">{commissions.length}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setCalculateDialogOpen(true)}
                                    size="sm"
                                    variant="outline"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Calculate Commissions
                                </Button>
                                <Link href="/dashboard/commissions">
                                    <Button size="sm" variant="outline">
                                        <Eye className="h-4 w-4 mr-2" />
                                        View All
                                    </Button>
                                </Link>
                            </div>

                            {/* Commissions List */}
                            {isLoading ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton key={i} className="h-16 w-full" />
                                    ))}
                                </div>
                            ) : commissions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <HandCoins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No commissions found</p>
                                    <p className="text-sm">Calculate commissions to get started</p>
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Invoice</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Calculated</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {commissions.map((commission) => {
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
                            )}
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>

            {/* Calculate Commissions Dialog */}
            <AlertDialog open={calculateDialogOpen} onOpenChange={setCalculateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Calculate Commissions</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will calculate commissions for all unpaid invoices for this agent. 
                            Commissions that already exist will be skipped.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCalculateCommissions}
                            disabled={calculateMutation.isPending}
                        >
                            {calculateMutation.isPending ? "Calculating..." : "Calculate"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
