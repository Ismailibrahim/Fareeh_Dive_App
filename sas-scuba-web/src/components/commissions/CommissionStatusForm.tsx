"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { AgentCommission } from "@/lib/api/services/commission.service";
import { paymentMethodService, PaymentMethod } from "@/lib/api/services/payment-method.service";
import { useUpdateCommission, useMarkCommissionAsPaid, useCancelCommission } from "@/lib/hooks/use-commissions";

const statusFormSchema = z.object({
    status: z.enum(['Pending', 'Paid', 'Cancelled']),
    payment_date: z.string().optional(),
    payment_method_id: z.string().optional(),
    payment_reference: z.string().optional(),
    payment_notes: z.string().optional(),
    notes: z.string().optional(),
});

type StatusFormValues = z.infer<typeof statusFormSchema>;

interface CommissionStatusFormProps {
    commission: AgentCommission;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CommissionStatusForm({
    commission,
    open,
    onOpenChange,
    onSuccess,
}: CommissionStatusFormProps) {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
    const updateMutation = useUpdateCommission();
    const markPaidMutation = useMarkCommissionAsPaid();
    const cancelMutation = useCancelCommission();

    useEffect(() => {
        if (open) {
            loadPaymentMethods();
        }
    }, [open]);

    const loadPaymentMethods = async () => {
        try {
            const data = await paymentMethodService.getAll({ is_active: true });
            setPaymentMethods(data);
        } catch (error) {
            console.error("Failed to fetch payment methods", error);
        } finally {
            setLoadingPaymentMethods(false);
        }
    };

    const form = useForm<StatusFormValues>({
        resolver: zodResolver(statusFormSchema),
        defaultValues: {
            status: commission.status,
            payment_date: commission.paid_at ? commission.paid_at.split('T')[0] : new Date().toISOString().split('T')[0],
            payment_method_id: commission.payment_method_id?.toString() || '',
            payment_reference: commission.payment_reference || '',
            payment_notes: commission.payment_notes || '',
            notes: commission.notes || '',
        },
    });

    const selectedStatus = form.watch('status');

    async function onSubmit(data: StatusFormValues) {
        try {
            if (data.status === 'Paid') {
                await markPaidMutation.mutateAsync({
                    id: commission.id,
                    paymentDate: data.payment_date,
                    paymentMethodId: data.payment_method_id ? parseInt(data.payment_method_id) : undefined,
                    paymentReference: data.payment_reference,
                    paymentNotes: data.payment_notes,
                });
            } else if (data.status === 'Cancelled') {
                await cancelMutation.mutateAsync({
                    id: commission.id,
                    reason: data.notes,
                });
            } else {
                await updateMutation.mutateAsync({
                    id: commission.id,
                    status: data.status,
                    notes: data.notes,
                });
            }
            onSuccess();
        } catch (error) {
            console.error("Failed to update commission", error);
        }
    }

    const isLoading = updateMutation.isPending || markPaidMutation.isPending || cancelMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Update Commission Status</DialogTitle>
                    <DialogDescription>
                        Update the status and payment information for this commission.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Paid">Paid</SelectItem>
                                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedStatus === 'Paid' && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="payment_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Payment Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="payment_method_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Payment Method</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={loadingPaymentMethods}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select payment method" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="">None</SelectItem>
                                                    {paymentMethods.map((method) => (
                                                        <SelectItem key={method.id} value={method.id.toString()}>
                                                            {method.name} ({method.method_type})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="payment_reference"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Payment Reference</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Reference number..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="payment_notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Payment Notes</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Additional payment notes..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {(selectedStatus === 'Pending' || selectedStatus === 'Cancelled') && (
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Additional notes..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Updating..." : "Update Status"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
