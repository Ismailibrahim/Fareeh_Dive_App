"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HandCoins, Eye, Plus, CheckCircle2, XCircle, Clock, DollarSign } from "lucide-react";
import { useCommissions, useCalculateCommissions } from "@/lib/hooks/use-commissions";
import { safeFormatDate } from "@/lib/utils/date-format";
import Link from "next/link";
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
import { useState } from "react";

interface InvoiceCommissionSectionProps {
    invoiceId: number | string;
    agentId?: number | null;
}

export function InvoiceCommissionSection({ invoiceId, agentId }: InvoiceCommissionSectionProps) {
    const [calculateDialogOpen, setCalculateDialogOpen] = useState(false);
    
    const { data: commissionsData, isLoading } = useCommissions({
        agent_id: agentId || undefined,
        per_page: 10,
    });
    
    const calculateMutation = useCalculateCommissions();

    // Find commission for this invoice
    const commission = commissionsData?.data?.find(
        c => c.invoice_id === (typeof invoiceId === 'string' ? parseInt(invoiceId) : invoiceId)
    );

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

    const handleCalculateCommission = async () => {
        if (!agentId) return;
        try {
            await calculateMutation.mutateAsync({
                agentId,
                invoiceIds: [typeof invoiceId === 'string' ? parseInt(invoiceId) : invoiceId],
            });
            setCalculateDialogOpen(false);
        } catch (error) {
            console.error("Failed to calculate commission", error);
        }
    };

    if (!agentId) {
        return null; // Don't show commission section if invoice has no agent
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <HandCoins className="h-5 w-5 text-primary" />
                            <CardTitle>Commission</CardTitle>
                        </div>
                        {!commission && (
                            <Button
                                onClick={() => setCalculateDialogOpen(true)}
                                size="sm"
                                variant="outline"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Calculate
                            </Button>
                        )}
                    </div>
                    <CardDescription>
                        Commission information for this invoice
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ) : commission ? (
                        <div className="space-y-4">
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
                                    <p className="text-lg font-semibold flex items-center gap-1">
                                        <DollarSign className="h-4 w-4" />
                                        {parseFloat(commission.commission_amount || '0').toFixed(2)}
                                    </p>
                                </div>
                                {commission.calculated_at && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Calculated</p>
                                        <p className="text-sm">{safeFormatDate(commission.calculated_at)}</p>
                                    </div>
                                )}
                                {commission.paid_at && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Paid</p>
                                        <p className="text-sm">{safeFormatDate(commission.paid_at)}</p>
                                    </div>
                                )}
                            </div>
                            {commission.notes && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Notes</p>
                                    <p className="text-sm">{commission.notes}</p>
                                </div>
                            )}
                            <div className="pt-2 border-t">
                                <Link href={`/dashboard/commissions/${commission.id}`}>
                                    <Button variant="outline" size="sm" className="w-full">
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Commission Details
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-muted-foreground">
                            <HandCoins className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No commission calculated yet</p>
                            <Button
                                onClick={() => setCalculateDialogOpen(true)}
                                size="sm"
                                variant="outline"
                                className="mt-4"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Calculate Commission
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Calculate Commission Dialog */}
            <AlertDialog open={calculateDialogOpen} onOpenChange={setCalculateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Calculate Commission</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will calculate the commission for this invoice based on the agent's commercial terms.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCalculateCommission}
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
