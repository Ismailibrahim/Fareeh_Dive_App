"use client";

import { useEffect } from "react";
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
import { expenseCategoryService, ExpenseCategory, ExpenseCategoryFormData } from "@/lib/api/services/expense-category.service";

const expenseCategorySchema = z.object({
    name: z.string().min(1, "Category name is required.").max(255, "Name must be less than 255 characters."),
    description: z.string().optional(),
});

interface ExpenseCategoryFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    expenseCategory?: ExpenseCategory | null;
    onSuccess: () => void;
}

export function ExpenseCategoryForm({ open, onOpenChange, expenseCategory, onSuccess }: ExpenseCategoryFormProps) {
    const form = useForm<ExpenseCategoryFormData>({
        resolver: zodResolver(expenseCategorySchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    // Reset form when expenseCategory changes
    useEffect(() => {
        if (expenseCategory) {
            form.reset({
                name: expenseCategory.name,
                description: expenseCategory.description || "",
            });
        } else {
            form.reset({
                name: "",
                description: "",
            });
        }
    }, [expenseCategory, form]);

    const onSubmit = async (data: ExpenseCategoryFormData) => {
        try {
            if (expenseCategory) {
                await expenseCategoryService.update(expenseCategory.id, data);
            } else {
                await expenseCategoryService.create(data);
            }
            onSuccess();
            onOpenChange(false);
            form.reset();
        } catch (error: any) {
            console.error("Failed to save expense category", error);
            const errorMessage = error.response?.data?.message || "Failed to save expense category.";
            alert(errorMessage);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {expenseCategory ? "Edit Expense Category" : "Add Expense Category"}
                    </DialogTitle>
                    <DialogDescription>
                        {expenseCategory
                            ? "Update the expense category details."
                            : "Add a new expense category to organize expenses."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Equipment, Fuel, Maintenance" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Brief description of this category"
                                            {...field}
                                            rows={3}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">
                                {expenseCategory ? "Update" : "Add"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}