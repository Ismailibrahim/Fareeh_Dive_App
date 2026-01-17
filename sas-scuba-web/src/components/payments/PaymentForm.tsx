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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { paymentService, PaymentFormData } from "@/lib/api/services/payment.service";
import { paymentMethodService, PaymentMethod, PaymentMethodType } from "@/lib/api/services/payment-method.service";
import { invoiceService, Invoice } from "@/lib/api/services/invoice.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar } from "lucide-react";
import { SafeDatePicker as DatePicker } from "@/components/ui/safe-date-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const paymentSchema = z.object({
    invoice_id: z.number(),
    amount: z.number().min(0.01, "Amount must be greater than 0"),
    payment_type: z.enum(['Advance', 'Final', 'Refund']),
    payment_date: z.string().optional(),
    method: z.enum(['Cash', 'Card', 'Bank']).optional(), // Deprecated, kept for backward compatibility
    reference: z.string().optional(), // Deprecated, kept for backward compatibility
    payment_method_id: z.number().optional(),
    method_type: z.enum(['Bank Transfer', 'Crypto', 'Credit Card', 'Wallet', 'Cash']).optional(),
    method_subtype: z.string().optional(),
    // Bank Transfer fields
    tt_reference: z.string().optional(),
    account_no: z.string().optional(),
    bank_name: z.string().optional(),
    // Crypto fields
    crypto_type: z.string().optional(),
    transaction_link: z.string().optional(),
    // Credit Card fields
    card_type: z.string().optional(),
    reference_number: z.string().optional(),
    // Wallet fields
    wallet_type: z.string().optional(),
    // Cash fields
    currency: z.string().optional(),
}).refine((data) => {
    // If method_type is provided, validate required fields based on type
    if (!data.method_type) return true;
    
    if (data.method_type === 'Bank Transfer') {
        return !!(data.tt_reference || data.account_no || data.bank_name);
    }
    if (data.method_type === 'Crypto') {
        return !!(data.crypto_type && data.transaction_link);
    }
    if (data.method_type === 'Credit Card') {
        return !!(data.card_type && data.reference_number);
    }
    if (data.method_type === 'Wallet') {
        return !!(data.wallet_type && data.reference_number);
    }
    if (data.method_type === 'Cash') {
        return !!data.currency;
    }
    return true;
}, {
    message: "Please fill in all required fields for the selected payment method",
});

interface PaymentFormProps {
    invoice: Invoice;
    onSuccess?: () => void;
}

export function PaymentForm({ invoice, onSuccess }: PaymentFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [remainingBalance, setRemainingBalance] = useState(0);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loadingMethods, setLoadingMethods] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

    useEffect(() => {
        if (invoice) {
            const totalPaid = invoice.payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
            setRemainingBalance(Number(invoice.total || 0) - totalPaid);
        }
    }, [invoice]);

    // Load payment methods on mount
    useEffect(() => {
        loadPaymentMethods();
    }, []);

    const loadPaymentMethods = async () => {
        setLoadingMethods(true);
        try {
            const methods = await paymentMethodService.getAll({ is_active: true });
            setPaymentMethods(methods);
        } catch (error) {
            console.error("Failed to load payment methods", error);
        } finally {
            setLoadingMethods(false);
        }
    };

    const form = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            invoice_id: invoice.id,
            amount: remainingBalance > 0 ? remainingBalance : 0,
            payment_type: 'Final',
            payment_date: new Date().toISOString().split('T')[0],
            method: 'Cash', // Backward compatibility
            reference: '', // Backward compatibility
        },
    });

    // Watch method_type to show/hide conditional fields
    const methodType = form.watch('method_type');
    const paymentMethodId = form.watch('payment_method_id');

    // Update selected payment method when payment_method_id changes
    useEffect(() => {
        if (paymentMethodId) {
            const method = paymentMethods.find(m => m.id === paymentMethodId);
            if (method) {
                setSelectedPaymentMethod(method);
                form.setValue('method_type', method.method_type);
            }
        } else {
            setSelectedPaymentMethod(null);
        }
    }, [paymentMethodId, paymentMethods, form]);

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
                                <p className="text-lg font-semibold">${Number(invoice.total || 0).toFixed(2)}</p>
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

                        {paymentMethods.length > 0 ? (
                            <FormField
                                control={form.control}
                                name="payment_method_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Method</FormLabel>
                                        <Select 
                                            onValueChange={(value) => {
                                                field.onChange(value ? Number(value) : undefined);
                                                // Clear method-specific fields when method changes
                                                form.setValue('method_type', undefined);
                                                form.setValue('method_subtype', undefined);
                                                form.setValue('tt_reference', undefined);
                                                form.setValue('account_no', undefined);
                                                form.setValue('bank_name', undefined);
                                                form.setValue('crypto_type', undefined);
                                                form.setValue('transaction_link', undefined);
                                                form.setValue('card_type', undefined);
                                                form.setValue('reference_number', undefined);
                                                form.setValue('wallet_type', undefined);
                                                form.setValue('currency', undefined);
                                            }} 
                                            value={field.value?.toString() || ""}
                                            disabled={loadingMethods}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={loadingMethods ? "Loading payment methods..." : "Select payment method"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {paymentMethods.map((method) => (
                                                    <SelectItem key={method.id} value={method.id.toString()}>
                                                        {method.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ) : (
                            <>
                                <FormField
                                    control={form.control}
                                    name="method"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Payment Method (Legacy)</FormLabel>
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
                                            <FormDescription>
                                                No payment methods configured. Using legacy method selection.
                                            </FormDescription>
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
                            </>
                        )}

                        {/* Conditional fields based on method type */}
                        {methodType === 'Bank Transfer' && (
                            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                <h4 className="font-medium">Bank Transfer Details</h4>
                                <FormField
                                    control={form.control}
                                    name="tt_reference"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>T.T Reference Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter T.T reference number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="account_no"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter account number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bank_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bank Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter bank name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {methodType === 'Crypto' && (
                            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                <h4 className="font-medium">Crypto Payment Details</h4>
                                <FormField
                                    control={form.control}
                                    name="crypto_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Crypto Type</FormLabel>
                                            <Select onValueChange={(value) => {
                                                field.onChange(value);
                                                form.setValue('method_subtype', value);
                                            }} value={field.value || ""}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select crypto type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="USDT">USDT</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="transaction_link"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Transaction Link</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Enter transaction link" 
                                                    rows={3}
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {methodType === 'Credit Card' && (
                            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                <h4 className="font-medium">Credit Card Details</h4>
                                <FormField
                                    control={form.control}
                                    name="card_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Card Type</FormLabel>
                                            <Select onValueChange={(value) => {
                                                field.onChange(value);
                                                form.setValue('method_subtype', value);
                                            }} value={field.value || ""}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select card type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Visa">Visa</SelectItem>
                                                    <SelectItem value="Master">Master</SelectItem>
                                                    <SelectItem value="AMEX">AMEX</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="reference_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reference Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter reference number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {methodType === 'Wallet' && (
                            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                <h4 className="font-medium">Wallet Payment Details</h4>
                                <FormField
                                    control={form.control}
                                    name="wallet_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Wallet Type</FormLabel>
                                            <Select onValueChange={(value) => {
                                                field.onChange(value);
                                                form.setValue('method_subtype', value);
                                            }} value={field.value || ""}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select wallet type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Favara Ali Pay">Favara Ali Pay</SelectItem>
                                                    <SelectItem value="UPI">UPI</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="reference_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reference Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter reference number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {methodType === 'Cash' && (
                            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                <h4 className="font-medium">Cash Payment Details</h4>
                                <FormField
                                    control={form.control}
                                    name="currency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Currency</FormLabel>
                                            <Select onValueChange={(value) => {
                                                field.onChange(value);
                                                form.setValue('method_subtype', value);
                                            }} value={field.value || ""}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select currency" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="MVR">MVR</SelectItem>
                                                    <SelectItem value="USD">USD</SelectItem>
                                                    <SelectItem value="EURO">EURO</SelectItem>
                                                    <SelectItem value="POUND">POUND</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
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

