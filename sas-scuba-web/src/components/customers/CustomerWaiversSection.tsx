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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { FileText, ChevronDown, Plus, Calendar, CheckCircle2, XCircle, Clock, Eye } from "lucide-react";
import { WaiverSignature } from "@/lib/api/services/waiver.service";
import { useWaiverSignatures } from "@/lib/hooks/use-waiver-signatures";
import { safeFormatDate } from "@/lib/utils/date-format";
import Link from "next/link";

interface CustomerWaiversSectionProps {
    customerId: number | string;
}

export function CustomerWaiversSection({ customerId }: CustomerWaiversSectionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedSignature, setSelectedSignature] = useState<WaiverSignature | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);

    const { data: signaturesResponse, isLoading } = useWaiverSignatures(customerId);
    const signatures = signaturesResponse?.data || [];

    const getStatusBadge = (signature: WaiverSignature) => {
        if (!signature.is_valid) {
            return { variant: 'destructive' as const, label: 'Invalidated' };
        }
        
        // Check if expired
        if (signature.expires_at) {
            const expiryDate = new Date(signature.expires_at);
            if (expiryDate < new Date()) {
                return { variant: 'secondary' as const, label: 'Expired' };
            }
        }
        
        if (signature.verification_status === 'verified') {
            return { variant: 'default' as const, label: 'Verified' };
        }
        if (signature.verification_status === 'rejected') {
            return { variant: 'destructive' as const, label: 'Rejected' };
        }
        return { variant: 'outline' as const, label: 'Pending Verification' };
    };

    const handleViewSignature = (signature: WaiverSignature) => {
        setSelectedSignature(signature);
        setViewDialogOpen(true);
    };

    return (
        <>
            <Card>
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-xl">Waiver Signatures</CardTitle>
                                </div>
                                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                            </div>
                            <CardDescription>
                                View and manage customer waiver signatures
                            </CardDescription>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="space-y-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                </div>
                            ) : signatures.length === 0 ? (
                                <div className="text-center py-8 space-y-4">
                                    <FileText className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                                    <div>
                                        <p className="text-sm font-medium">No waiver signatures yet</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Sign a waiver for this customer
                                        </p>
                                    </div>
                                    <Link href={`/dashboard/waivers?customer_id=${customerId}`}>
                                        <Button size="sm">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Sign New Waiver
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        {signatures.map((signature) => {
                                            const statusBadge = getStatusBadge(signature);
                                            return (
                                                <div
                                                    key={signature.id}
                                                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-primary" />
                                                                <h4 className="font-semibold text-sm">
                                                                    {signature.waiver?.name || 'Unknown Waiver'}
                                                                </h4>
                                                                <Badge variant={statusBadge.variant} className="text-xs">
                                                                    {statusBadge.label}
                                                                </Badge>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                                {signature.waiver?.type && (
                                                                    <div className="flex items-center gap-1">
                                                                        <FileText className="h-3 w-3" />
                                                                        <span className="capitalize">{signature.waiver.type}</span>
                                                                    </div>
                                                                )}
                                                                {signature.signed_at && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        <span>
                                                                            Signed: {safeFormatDate(signature.signed_at, "MMM dd, yyyy 'at' HH:mm", "N/A")}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {signature.expires_at && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        <span>
                                                                            Expires: {safeFormatDate(signature.expires_at, "MMM dd, yyyy", "N/A")}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {signature.verification_status === 'verified' && signature.verified_at && (
                                                                    <div className="flex items-center gap-1">
                                                                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                                                                        <span>
                                                                            Verified: {safeFormatDate(signature.verified_at, "MMM dd, yyyy", "N/A")}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {signature.signature_data && (
                                                                <div className="mt-2">
                                                                    <img
                                                                        src={signature.signature_data}
                                                                        alt={`Signature for ${signature.waiver?.name || 'waiver'}`}
                                                                        className="max-w-[200px] max-h-20 border rounded bg-white p-2 object-contain"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8"
                                                                onClick={() => handleViewSignature(signature)}
                                                            >
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                View
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="pt-2">
                                        <Link href={`/dashboard/waivers`}>
                                            <Button variant="outline" className="w-full">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Sign New Waiver
                                            </Button>
                                        </Link>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>

            {/* Signature View Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedSignature?.waiver?.name || 'Waiver Signature'}
                        </DialogTitle>
                        <DialogDescription>
                            View signature details and metadata
                        </DialogDescription>
                    </DialogHeader>
                    {selectedSignature && (
                        <div className="space-y-4">
                            {/* Signature Image */}
                            {selectedSignature.signature_data && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">Signature</h4>
                                    <div className="border rounded-lg p-4 bg-white">
                                        <img
                                            src={selectedSignature.signature_data}
                                            alt={`Signature for ${selectedSignature.waiver?.name || 'waiver'}`}
                                            className="max-w-full border rounded"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Signature Details */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold">Details</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Waiver Type</p>
                                        <p className="font-medium capitalize">
                                            {selectedSignature.waiver?.type || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Status</p>
                                        <Badge variant={getStatusBadge(selectedSignature).variant}>
                                            {getStatusBadge(selectedSignature).label}
                                        </Badge>
                                    </div>
                                    {selectedSignature.signed_at && (
                                        <div>
                                            <p className="text-muted-foreground">Signed Date</p>
                                            <p className="font-medium">
                                                {safeFormatDate(selectedSignature.signed_at, "MMM dd, yyyy 'at' HH:mm", "N/A")}
                                            </p>
                                        </div>
                                    )}
                                    {selectedSignature.expires_at && (
                                        <div>
                                            <p className="text-muted-foreground">Expires Date</p>
                                            <p className="font-medium">
                                                {safeFormatDate(selectedSignature.expires_at, "MMM dd, yyyy", "N/A")}
                                            </p>
                                        </div>
                                    )}
                                    {selectedSignature.verification_status && (
                                        <div>
                                            <p className="text-muted-foreground">Verification Status</p>
                                            <p className="font-medium capitalize">
                                                {selectedSignature.verification_status}
                                            </p>
                                        </div>
                                    )}
                                    {selectedSignature.verified_at && (
                                        <div>
                                            <p className="text-muted-foreground">Verified Date</p>
                                            <p className="font-medium">
                                                {safeFormatDate(selectedSignature.verified_at, "MMM dd, yyyy 'at' HH:mm", "N/A")}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Audit Trail */}
                            {(selectedSignature.ip_address || selectedSignature.user_agent) && (
                                <div className="space-y-2 pt-4 border-t">
                                    <h4 className="text-sm font-semibold">Audit Trail</h4>
                                    <div className="space-y-1 text-xs text-muted-foreground">
                                        {selectedSignature.ip_address && (
                                            <p>IP Address: {selectedSignature.ip_address}</p>
                                        )}
                                        {selectedSignature.user_agent && (
                                            <p>User Agent: {selectedSignature.user_agent}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Verification Notes */}
                            {selectedSignature.verification_notes && (
                                <div className="space-y-2 pt-4 border-t">
                                    <h4 className="text-sm font-semibold">Verification Notes</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedSignature.verification_notes}
                                    </p>
                                </div>
                            )}

                            {/* Invalidation Reason */}
                            {selectedSignature.invalidation_reason && (
                                <div className="space-y-2 pt-4 border-t">
                                    <h4 className="text-sm font-semibold text-destructive">Invalidation Reason</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedSignature.invalidation_reason}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
