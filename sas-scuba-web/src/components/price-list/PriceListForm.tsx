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
import { priceListService, PriceListFormData, PriceList } from "@/lib/api/services/price-list.service";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, DollarSign } from "lucide-react";

const priceListSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
    notes: z.string().optional(),
});

interface PriceListFormProps {
    initialData?: PriceList;
    priceListId?: number | string;
    onSuccess?: (createdPriceList?: PriceList) => void;
}

export function PriceListForm({ initialData, priceListId, onSuccess }: PriceListFormProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<PriceListFormData>({
        resolver: zodResolver(priceListSchema),
        defaultValues: {
            name: initialData?.name || "",
            notes: initialData?.notes || "",
        },
    });

    async function onSubmit(data: PriceListFormData) {
        setLoading(true);
        try {
            // Determine the ID to use - prioritize priceListId prop, then initialData.id
            // Validate that the ID is a valid positive number
            const getIdValue = (id: number | string | undefined): number | undefined => {
                if (!id) return undefined;
                const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                return (!isNaN(numId) && numId > 0) ? numId : undefined;
            };

            const idToUse = getIdValue(priceListId) || getIdValue(initialData?.id);
            
            if (idToUse) {
                // Update existing price list
                await priceListService.update(idToUse, data);
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                // Create new price list
                const newPriceList = await priceListService.create(data);
                if (onSuccess) {
                    // Pass the created price list data to the callback
                    onSuccess(newPriceList);
                }
            }
        } catch (error) {
            console.error("Failed to save price list", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Price List Information
                        </CardTitle>
                        <CardDescription>
                            Update your price list name and notes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price List Name</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Standard Price List 2025" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {initialData?.base_currency && (
                            <div className="flex items-center gap-2 p-4 bg-muted rounded-md">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Base Currency:</span>
                                <span className="font-medium">{initialData.base_currency}</span>
                            </div>
                        )}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Additional notes about this price list..."
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

                <div className="flex justify-end gap-4">
                    <Button type="submit" size="lg" disabled={loading}>
                        {loading ? "Saving..." : "Save Price List"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

