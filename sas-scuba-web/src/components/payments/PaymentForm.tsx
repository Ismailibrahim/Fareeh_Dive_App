"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { paymentService, PaymentFormData } from "@/lib/api/services/payment.service";
import { invoiceService, Invoice } from "@/lib/api/services/invoice.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const paymentSchema = z.object({
    invoice_id: z.number(),
    amount: z.number().min(0.01, "Amount must be greater than 0"),
    payment_type: z.enum(['Advance', 'Final', 'Refund']),
    payment_date: z.string().optional(),
    method: z.enum(['Cash', 'Card', 'Bank']),
    reference: z.string().optional(),
});

interface PaymentFormProps {
    invoice: Invoice;
    onSuccess?: () => void;
}

export function PaymentForm({ invoice, onSuccess }: PaymentFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [remainingBalance, setRemainingBalance] = useState(0);

    useEffect(() => {
        if (invoice) {
            const totalPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
            setRemainingBalance(invoice.total - totalPaid);
        }
    }, [invoice]);

    const form = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            invoice_id: invoice.id,
            amount: remainingBalance > 0 ? remainingBalance : 0,
            payment_type: 'Final',
            payment_date: new Date().toISOString().split('T')[0],
            method: 'Cash',
            reference: '',
        },
    });

    // Update amount when remaining balance changes
    useEffect(() => {
        if (remainingBalance > 0) {
            form.setValue('amount', remainingBalance);
        }
    }, [remainingBalance, form]);

    async function onSubmit(data: PaymentFormData) {
        setLoading(true);
        try {
            await paymentService.create(data);
            if (onSuccess) {
                onSuccess();
            }
            router.refresh();
        } catch (error) {
            console.error("Failed to create payment", error);
        } finally {
            setLoading(false);
        }
    }

    const parseDate = (dateString: string | undefined): Date | null => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    };

    const formatDateToString = (date: Date | null): string => {
        if (!date) return "";
        return date.toISOString().split('T')[0];
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            Payment Information
                        </CardTitle>
                        <CardDescription>
                            Record a payment for invoice {invoice.invoice_no || `#${invoice.id}`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Invoice Summary */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Invoice Total</label>
                                <p className="text-lg font-semibold">${invoice.total.toFixed(2)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Remaining Balance</label>
                                <p className="text-lg font-semibold">${remainingBalance.toFixed(2)}</p>
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                max={remainingBalance}
                                                className="pl-9"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        Maximum: ${remainingBalance.toFixed(2)}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="payment_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payment Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select payment type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Advance">Advance</SelectItem>
                                            <SelectItem value="Final">Final</SelectItem>
                                            <SelectItem value="Refund">Refund</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="payment_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Payment Date</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                            <DatePicker
                                                selected={parseDate(field.value)}
                                                onChange={(date) => field.onChange(formatDateToString(date))}
                                                dateFormat="PPP"
                                                placeholderText="Pick a date"
                                                wrapperClassName="w-full"
                                                maxDate={new Date()}
                                                className={cn(
                                                    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] pl-9",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="method"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payment Method</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select payment method" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="Card">Card</SelectItem>
                                            <SelectItem value="Bank">Bank Transfer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="reference"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reference (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Payment reference number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading || remainingBalance <= 0}>
                        {loading ? "Processing..." : "Record Payment"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

