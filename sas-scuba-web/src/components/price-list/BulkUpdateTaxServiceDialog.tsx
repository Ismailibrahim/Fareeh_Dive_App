"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { priceListService } from "@/lib/api/services/price-list.service";
import { Receipt, Loader2, Check, X, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const updateSchema = z.object({
    tax_inclusive: z.boolean().optional(),
    service_charge_inclusive: z.boolean().optional(),
});

interface BulkUpdateTaxServiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    priceListId: number | string;
    selectedItemIds: number[];
    onSuccess: () => void;
}

export function BulkUpdateTaxServiceDialog({
    open,
    onOpenChange,
    priceListId,
    selectedItemIds,
    onSuccess,
}: BulkUpdateTaxServiceDialogProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof updateSchema>>({
        resolver: zodResolver(updateSchema),
        defaultValues: {
            tax_inclusive: undefined,
            service_charge_inclusive: undefined,
        },
    });

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            form.reset({
                tax_inclusive: undefined,
                service_charge_inclusive: undefined,
            });
        }
    }, [open, form]);

    async function onSubmit(data: z.infer<typeof updateSchema>) {
        if (selectedItemIds.length === 0) {
            alert("Please select at least one item to update.");
            return;
        }

        // Check if at least one field is being updated
        if (data.tax_inclusive === undefined && data.service_charge_inclusive === undefined) {
            alert("Please select at least one setting to update.");
            return;
        }

        setLoading(true);
        try {
            await priceListService.bulkUpdateTaxService(
                priceListId,
                selectedItemIds,
                data.tax_inclusive,
                data.service_charge_inclusive
            );
            form.reset();
            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
            console.error("Failed to update settings", error);
            alert(error.response?.data?.message || "Failed to update settings. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const selectedCount = selectedItemIds.length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[400px] max-w-[400px] p-4" style={{ maxWidth: '400px' }}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-primary" />
                        Update Tax & Service Charge Settings
                    </DialogTitle>
                    <DialogDescription>
                        Update tax and service charge settings for {selectedCount} selected item{selectedCount > 1 ? 's' : ''}.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="tax_inclusive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                                    <FormControl>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={field.value === true}
                                                onCheckedChange={(checked) => {
                                                    // Cycle: undefined -> true -> false -> undefined
                                                    if (field.value === undefined) {
                                                        field.onChange(true);
                                                    } else if (field.value === true) {
                                                        field.onChange(false);
                                                    } else {
                                                        field.onChange(undefined);
                                                    }
                                                }}
                                            />
                                            {field.value === true && (
                                                <Badge variant="default" className="gap-1">
                                                    <Check className="h-3 w-3" /> Inclusive
                                                </Badge>
                                            )}
                                            {field.value === false && (
                                                <Badge variant="secondary" className="gap-1">
                                                    <X className="h-3 w-3" /> Exclusive
                                                </Badge>
                                            )}
                                            {field.value === undefined && (
                                                <Badge variant="outline" className="gap-1">
                                                    <Minus className="h-3 w-3" /> Unchanged
                                                </Badge>
                                            )}
                                        </div>
                                    </FormControl>
                                    <div className="space-y-1 leading-none flex-1">
                                        <FormLabel className="cursor-pointer">
                                            Tax Inclusive
                                        </FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                            Click to cycle: Unchanged → Inclusive → Exclusive
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="service_charge_inclusive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                                    <FormControl>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={field.value === true}
                                                onCheckedChange={(checked) => {
                                                    // Cycle: undefined -> true -> false -> undefined
                                                    if (field.value === undefined) {
                                                        field.onChange(true);
                                                    } else if (field.value === true) {
                                                        field.onChange(false);
                                                    } else {
                                                        field.onChange(undefined);
                                                    }
                                                }}
                                            />
                                            {field.value === true && (
                                                <Badge variant="default" className="gap-1">
                                                    <Check className="h-3 w-3" /> Inclusive
                                                </Badge>
                                            )}
                                            {field.value === false && (
                                                <Badge variant="secondary" className="gap-1">
                                                    <X className="h-3 w-3" /> Exclusive
                                                </Badge>
                                            )}
                                            {field.value === undefined && (
                                                <Badge variant="outline" className="gap-1">
                                                    <Minus className="h-3 w-3" /> Unchanged
                                                </Badge>
                                            )}
                                        </div>
                                    </FormControl>
                                    <div className="space-y-1 leading-none flex-1">
                                        <FormLabel className="cursor-pointer">
                                            Service Charge Inclusive
                                        </FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                            Click to cycle: Unchanged → Inclusive → Exclusive
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Settings"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

