"use client";

import { useState, useEffect } from "react";
import { waiverService, Waiver } from "@/lib/api/services/waiver.service";
import { customerService, Customer } from "@/lib/api/services/customer.service";
import { DigitalSignature } from "./DigitalSignature";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { User, FileText } from "lucide-react";

interface WaiverSigningFormProps {
    waiver: Waiver;
    customerId?: number;
    bookingId?: number;
    onSuccess?: () => void;
}

export function WaiverSigningForm({
    waiver,
    customerId,
    bookingId,
    onSuccess,
}: WaiverSigningFormProps) {
    const router = useRouter();
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(customerId);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!customerId) {
            loadCustomers();
        }
    }, [customerId]);

    const loadCustomers = async () => {
        setLoadingCustomers(true);
        try {
            const data = await customerService.getAll({});
            setCustomers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load customers", error);
            toast.error("Failed to load customers");
        } finally {
            setLoadingCustomers(false);
        }
    };

    const handleSubmit = async () => {
        if (!signatureData && waiver.requires_signature) {
            toast.error("Please provide a signature");
            return;
        }

        if (!selectedCustomerId) {
            toast.error("Please select a customer");
            return;
        }

        setIsSubmitting(true);
        try {
            await waiverService.createSignature({
                waiver_id: waiver.id,
                customer_id: selectedCustomerId,
                signature_data: signatureData || "",
                booking_id: bookingId,
            });
            toast.success("Waiver signed successfully");
            onSuccess?.();
            if (selectedCustomerId) {
                router.push(`/dashboard/customers/${selectedCustomerId}`);
            } else {
                router.push("/dashboard/waivers");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to sign waiver");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        {waiver.name}
                    </CardTitle>
                    {waiver.description && (
                        <CardDescription>{waiver.description}</CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    <div
                        className="prose max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: waiver.content }}
                    />
                </CardContent>
            </Card>

            {!customerId && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            Select Customer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="customer">Customer *</Label>
                            <Select
                                value={selectedCustomerId?.toString()}
                                onValueChange={(value) => setSelectedCustomerId(parseInt(value, 10))}
                                disabled={loadingCustomers}
                            >
                                <SelectTrigger id="customer">
                                    <SelectValue placeholder="Select a customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((customer) => (
                                        <SelectItem key={customer.id} value={String(customer.id)}>
                                            {customer.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            )}

            {waiver.requires_signature && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Digital Signature</CardTitle>
                        <CardDescription>
                            Please sign in the box below to complete this waiver.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DigitalSignature
                            onSignatureChange={setSignatureData}
                        />
                    </CardContent>
                </Card>
            )}

            <div className="flex justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={!selectedCustomerId || (!signatureData && waiver.requires_signature) || isSubmitting}
                >
                    {isSubmitting ? "Signing..." : "Sign Waiver"}
                </Button>
            </div>
        </div>
    );
}
