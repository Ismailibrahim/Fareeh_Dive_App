"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { priceListService, PriceList } from "@/lib/api/services/price-list.service";
import { DollarSign, TrendingUp, TrendingDown, Loader2, Calculator } from "lucide-react";
import { formatPrice } from "@/lib/utils/currency";

const adjustSchema = z.object({
    adjustment_type: z.enum(["percentage", "multiplier"]),
    adjustment_value: z.number(),
    rounding_type: z.enum(["nearest_10", "whole_number"]).optional(),
}).superRefine((data, ctx) => {
    if (data.adjustment_type === "percentage") {
        if (data.adjustment_value < -100) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Percentage must be >= -100",
                path: ["adjustment_value"],
            });
        }
    } else {
        if (data.adjustment_value <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Multiplier must be > 0",
                path: ["adjustment_value"],
            });
        }
    }
});

interface BulkPriceAdjustDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    priceList: PriceList | null;
    selectedItemIds?: number[];
    onSuccess: () => void;
}

export function BulkPriceAdjustDialog({
    open,
    onOpenChange,
    priceList,
    selectedItemIds = [],
    onSuccess,
}: BulkPriceAdjustDialogProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof adjustSchema>>({
        resolver: zodResolver(adjustSchema),
        defaultValues: {
            adjustment_type: "percentage",
            adjustment_value: 0,
            rounding_type: undefined,
        },
    });

    const adjustmentType = form.watch("adjustment_type");
    const adjustmentValue = form.watch("adjustment_value");
    const roundingType = form.watch("rounding_type");

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            form.reset({
                adjustment_type: "percentage",
                adjustment_value: 0,
                rounding_type: undefined,
            });
        }
    }, [open, form]);

    // Filter items based on selection
    const itemsToAdjust = useMemo(() => {
        if (!priceList?.items) return [];
        if (selectedItemIds.length === 0) return priceList.items;
        return priceList.items.filter(item => selectedItemIds.includes(item.id));
    }, [priceList, selectedItemIds]);

    // Calculate preview prices
    const preview = useMemo(() => {
        if (!itemsToAdjust || itemsToAdjust.length === 0 || adjustmentValue === 0) {
            return null;
        }

        // Get a sample item for preview
        const sampleItem = itemsToAdjust[0];
        const oldPrice = sampleItem.price;

        let calculatedPrice: number;
        if (adjustmentType === "percentage") {
            calculatedPrice = oldPrice * (1 + adjustmentValue / 100);
        } else {
            calculatedPrice = oldPrice * adjustmentValue;
        }

        let newPrice = calculatedPrice;
        if (roundingType === "nearest_10") {
            newPrice = Math.round(calculatedPrice / 10) * 10;
        } else if (roundingType === "whole_number") {
            newPrice = Math.round(calculatedPrice);
        } else {
            newPrice = Math.round(calculatedPrice * 100) / 100;
        }

        // Ensure price doesn't go below 0
        newPrice = Math.max(0, newPrice);

        return {
            itemName: sampleItem.name,
            oldPrice,
            calculatedPrice,
            newPrice,
            isIncrease: newPrice > oldPrice,
        };
    }, [itemsToAdjust, adjustmentType, adjustmentValue, roundingType]);

    async function onSubmit(data: z.infer<typeof adjustSchema>) {
        if (!priceList) return;

        // If no items selected, use all items
        const itemIdsToAdjust = selectedItemIds.length > 0 ? selectedItemIds : undefined;

        setLoading(true);
        try {
            await priceListService.bulkAdjustPrices(
                priceList.id,
                data.adjustment_type,
                data.adjustment_value,
                data.rounding_type,
                itemIdsToAdjust
            );
            form.reset();
            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
            console.error("Failed to adjust prices", error);
            alert(error.response?.data?.message || "Failed to adjust prices. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const baseCurrency = priceList?.base_currency || "USD";
    const itemCount = itemsToAdjust.length;
    const selectedCount = selectedItemIds.length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-primary" />
                        Bulk Adjust Prices
                    </DialogTitle>
                    <DialogDescription>
                        {selectedCount > 0
                            ? `Adjust prices for ${selectedCount} selected item${selectedCount > 1 ? 's' : ''} in "${priceList?.name}".`
                            : `Adjust prices for all ${itemCount} items in "${priceList?.name}".`}
                        {" "}You can increase or decrease prices using percentage or multiplier.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="adjustment_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Adjustment Type</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            className="flex gap-6"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="percentage" id="percentage" />
                                                <Label htmlFor="percentage" className="cursor-pointer">
                                                    Percentage (%)
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="multiplier" id="multiplier" />
                                                <Label htmlFor="multiplier" className="cursor-pointer">
                                                    Multiplier
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="adjustment_value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {adjustmentType === "percentage" ? "Percentage Change" : "Multiplier"}
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                step={adjustmentType === "percentage" ? "1" : "0.01"}
                                                placeholder={
                                                    adjustmentType === "percentage"
                                                        ? "e.g., 10 for +10%, -10 for -10%"
                                                        : "e.g., 1.1 for +10%, 0.9 for -10%"
                                                }
                                                className="pl-9"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                value={field.value || ""}
                                                disabled={loading}
                                            />
                                        </div>
                                    </FormControl>
                                    <p className="text-sm text-muted-foreground">
                                        {adjustmentType === "percentage"
                                            ? "Positive values increase prices, negative values decrease prices (min: -100%)"
                                            : "Values > 1 increase prices, values < 1 decrease prices (min: > 0)"}
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="rounding_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Round Prices (Optional)</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={(value) => field.onChange(value || undefined)}
                                            value={field.value || ""}
                                            className="flex gap-6"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="" id="no-rounding" />
                                                <Label htmlFor="no-rounding" className="cursor-pointer">
                                                    No Rounding
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="nearest_10" id="nearest_10" />
                                                <Label htmlFor="nearest_10" className="cursor-pointer">
                                                    Round to Nearest 10
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="whole_number" id="whole_number" />
                                                <Label htmlFor="whole_number" className="cursor-pointer">
                                                    Round to Whole Number
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {preview && adjustmentValue !== 0 && (
                            <div
                                className={`rounded-lg border p-4 ${
                                    preview.isIncrease
                                        ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                                        : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    {preview.isIncrease ? (
                                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    )}
                                    <span className="font-semibold text-sm">Preview</span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Item: </span>
                                        <span className="font-medium">{preview.itemName}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Current Price: </span>
                                        <span className="font-medium">{formatPrice(preview.oldPrice, baseCurrency)}</span>
                                    </div>
                                    {roundingType && preview.calculatedPrice !== preview.newPrice && (
                                        <div>
                                            <span className="text-muted-foreground">After Adjustment: </span>
                                            <span className="font-medium">
                                                {formatPrice(preview.calculatedPrice, baseCurrency)}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-muted-foreground">New Price: </span>
                                        <span
                                            className={`font-bold ${
                                                preview.isIncrease
                                                    ? "text-green-600 dark:text-green-400"
                                                    : "text-red-600 dark:text-red-400"
                                            }`}
                                        >
                                            {formatPrice(preview.newPrice, baseCurrency)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading || adjustmentValue === 0}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adjusting...
                                    </>
                                ) : (
                                    "Apply Adjustment"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

