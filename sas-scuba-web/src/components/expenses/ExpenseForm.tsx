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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { expenseService, Expense, ExpenseFormData } from "@/lib/api/services/expense.service";
import { supplierService, Supplier } from "@/lib/api/services/supplier.service";
import { expenseCategoryService, ExpenseCategory } from "@/lib/api/services/expense-category.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DollarSign, CalendarIcon, Building2, Tag, AlertCircle, FileText, Repeat } from "lucide-react";
import { SafeDatePicker as DatePicker } from "@/components/ui/safe-date-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { safeParseDate } from "@/lib/utils/date-format";

const expenseSchema = z.object({
    supplier_id: z.number().min(1, "Supplier is required"),
    expense_category_id: z.number().min(1, "Expense category is required"),
    expense_date: z.date(),
    description: z.string().min(1, "Description is required").max(255, "Description must be less than 255 characters"),
    amount: z.number().min(0.01, "Amount must be greater than 0"),
    currency: z.string().length(3, "Currency must be 3 characters"),
    is_recurring: z.boolean().optional(),
    recurring_period: z.enum(['Weekly', 'Monthly', 'Quarterly', 'Yearly']).optional(),
    notes: z.string().optional(),
}).refine((data) => {
    if (data.is_recurring && !data.recurring_period) {
        return false;
    }
    return true;
}, {
    message: "Recurring period is required when expense is recurring",
    path: ["recurring_period"],
});

interface ExpenseFormProps {
    initialData?: Expense;
    expenseId?: string | number;
}

export function ExpenseForm({ initialData, expenseId }: ExpenseFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [suppliersData, categoriesData] = await Promise.all([
                    supplierService.getAll(),
                    expenseCategoryService.getAll(),
                ]);
                setSuppliers(suppliersData);
                setExpenseCategories(categoriesData);
            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        fetchData();
    }, []);

    const form = useForm<{
        supplier_id: number;
        expense_category_id: number;
        expense_date: Date;
        description: string;
        amount: number;
        currency: string;
        is_recurring?: boolean;
        recurring_period?: 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
        notes?: string;
    }>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            supplier_id: initialData?.supplier_id || 0,
            expense_category_id: initialData?.expense_category_id || 0,
            expense_date: initialData?.expense_date ? safeParseDate(initialData.expense_date) || new Date() : new Date(),
            description: initialData?.description || "",
            amount: initialData?.amount || 0,
            currency: initialData?.currency || "USD",
            is_recurring: initialData?.is_recurring || false,
            recurring_period: initialData?.recurring_period || undefined,
            notes: initialData?.notes || "",
        },
    });

    const isRecurring = form.watch('is_recurring');

    async function onSubmit(data: {
        supplier_id: number;
        expense_category_id: number;
        expense_date: Date;
        description: string;
        amount: number;
        currency: string;
        is_recurring?: boolean;
        recurring_period?: 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
        notes?: string;
    }) {
        setLoading(true);
        setError(null);
        try {
            const formData: ExpenseFormData = {
                supplier_id: data.supplier_id,
                expense_category_id: data.expense_category_id,
                expense_date: format(data.expense_date, "yyyy-MM-dd"),
                description: data.description,
                amount: data.amount,
                currency: data.currency,
                is_recurring: data.is_recurring || false,
                recurring_period: data.is_recurring ? data.recurring_period : undefined,
                notes: data.notes || undefined,
            };

            if (expenseId) {
                await expenseService.update(Number(expenseId), formData);
                router.push("/dashboard/expenses");
                router.refresh();
            } else {
                const expense = await expenseService.create(formData);
                router.push(`/dashboard/expenses/${expense.id}`);
                router.refresh();
            }
        } catch (error: any) {
            console.error("Failed to save expense", error);
            const errorMessage = error?.response?.data?.message 
                || error?.response?.data?.error 
                || (error?.response?.data?.errors ? JSON.stringify(error.response.data.errors) : null)
                || error?.message 
                || "Failed to save expense. Please check all fields and try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                {/* Expense Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            Expense Information
                        </CardTitle>
                        <CardDescription>
                            Basic details about the expense.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="supplier_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Supplier *</FormLabel>
                                    <Select 
                                        onValueChange={(value) => field.onChange(Number(value))} 
                                        value={field.value ? String(field.value) : ""}
                                    >
                                        <FormControl>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                <SelectTrigger className="pl-9">
                                                    <SelectValue placeholder="Select a supplier" />
                                                </SelectTrigger>
                                            </div>
                                        </FormControl>
                                        <SelectContent>
                                            {suppliers.map((supplier) => (
                                                <SelectItem key={supplier.id} value={String(supplier.id)}>
                                                    {supplier.name}
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
                            name="expense_category_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Expense Category *</FormLabel>
                                    <Select 
                                        onValueChange={(value) => field.onChange(Number(value))} 
                                        value={field.value ? String(field.value) : ""}
                                    >
                                        <FormControl>
                                            <div className="relative">
                                                <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                <SelectTrigger className="pl-9">
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                            </div>
                                        </FormControl>
                                        <SelectContent>
                                            {expenseCategories.map((category) => (
                                                <SelectItem key={category.id} value={String(category.id)}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="expense_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Expense Date *</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                <DatePicker
                                                    selected={field.value}
                                                    onChange={(date) => field.onChange(date)}
                                                    dateFormat="PPP"
                                                    placeholderText="Pick a date"
                                                    wrapperClassName="w-full"
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
                                name="currency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Currency *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select currency" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="USD">USD</SelectItem>
                                                <SelectItem value="MVR">MVR</SelectItem>
                                                <SelectItem value="EUR">EUR</SelectItem>
                                                <SelectItem value="GBP">GBP</SelectItem>
                                                <SelectItem value="AUD">AUD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Fuel for boat trip" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount *</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                type="number" 
                                                step="0.01"
                                                placeholder="0.00" 
                                                className="pl-9" 
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                value={field.value || ""}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="is_recurring"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Recurring Expense</FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                            Check if this is a recurring expense
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {isRecurring && (
                            <FormField
                                control={form.control}
                                name="recurring_period"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Recurring Period *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <div className="relative">
                                                    <Repeat className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                    <SelectTrigger className="pl-9">
                                                        <SelectValue placeholder="Select period" />
                                                    </SelectTrigger>
                                                </div>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Weekly">Weekly</SelectItem>
                                                <SelectItem value="Monthly">Monthly</SelectItem>
                                                <SelectItem value="Quarterly">Quarterly</SelectItem>
                                                <SelectItem value="Yearly">Yearly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Additional Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Additional Information
                        </CardTitle>
                        <CardDescription>
                            Additional notes about the expense.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter any additional notes..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" size="lg" disabled={loading}>
                        {loading ? "Saving..." : (expenseId ? "Update Expense" : "Create Expense")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}