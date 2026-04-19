"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WaiverSignature } from "@/lib/api/services/waiver.service";
import { safeFormatDate } from "@/lib/utils/date-format";
import { FileText, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";

interface SignatureViewerProps {
    signature: WaiverSignature;
    className?: string;
}

export function SignatureViewer({ signature, className }: SignatureViewerProps) {
    const getStatusBadge = () => {
        if (!signature.is_valid) {
            return { variant: 'destructive' as const, label: 'Invalidated' };
        }
        
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

    const statusBadge = getStatusBadge();

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">
                            {signature.waiver?.name || 'Waiver Signature'}
                        </CardTitle>
                    </div>
                    <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                </div>
                <CardDescription>
                    Signature details and metadata
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Signature Image */}
                {signature.signature_data && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Signature</h4>
                        <div className="border rounded-lg p-4 bg-white">
                            <img
                                src={signature.signature_data}
                                alt={`Signature for ${signature.waiver?.name || 'waiver'}`}
                                className="max-w-full border rounded"
                            />
                        </div>
                    </div>
                )}

                {/* Signature Details */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {signature.waiver?.type && (
                            <div>
                                <p className="text-muted-foreground">Waiver Type</p>
                                <p className="font-medium capitalize">{signature.waiver.type}</p>
                            </div>
                        )}
                        {signature.signed_at && (
                            <div>
                                <p className="text-muted-foreground">Signed Date</p>
                                <p className="font-medium">
                                    {safeFormatDate(signature.signed_at, "MMM dd, yyyy 'at' HH:mm", "N/A")}
                                </p>
                            </div>
                        )}
                        {signature.expires_at && (
                            <div>
                                <p className="text-muted-foreground">Expires Date</p>
                                <p className="font-medium">
                                    {safeFormatDate(signature.expires_at, "MMM dd, yyyy", "N/A")}
                                </p>
                            </div>
                        )}
                        {signature.verification_status && (
                            <div>
                                <p className="text-muted-foreground">Verification Status</p>
                                <p className="font-medium capitalize">{signature.verification_status}</p>
                            </div>
                        )}
                        {signature.verified_at && (
                            <div>
                                <p className="text-muted-foreground">Verified Date</p>
                                <p className="font-medium">
                                    {safeFormatDate(signature.verified_at, "MMM dd, yyyy 'at' HH:mm", "N/A")}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Audit Trail */}
                {(signature.ip_address || signature.user_agent) && (
                    <div className="space-y-2 pt-4 border-t">
                        <h4 className="text-sm font-semibold">Audit Trail</h4>
                        <div className="space-y-1 text-xs text-muted-foreground">
                            {signature.ip_address && (
                                <p>IP Address: {signature.ip_address}</p>
                            )}
                            {signature.user_agent && (
                                <p>User Agent: {signature.user_agent}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Verification Notes */}
                {signature.verification_notes && (
                    <div className="space-y-2 pt-4 border-t">
                        <h4 className="text-sm font-semibold">Verification Notes</h4>
                        <p className="text-sm text-muted-foreground">
                            {signature.verification_notes}
                        </p>
                    </div>
                )}

                {/* Invalidation Reason */}
                {signature.invalidation_reason && (
                    <div className="space-y-2 pt-4 border-t">
                        <h4 className="text-sm font-semibold text-destructive">Invalidation Reason</h4>
                        <p className="text-sm text-muted-foreground">
                            {signature.invalidation_reason}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
