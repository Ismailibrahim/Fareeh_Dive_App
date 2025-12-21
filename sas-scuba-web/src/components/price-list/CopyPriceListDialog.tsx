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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { priceListService, PriceList } from "@/lib/api/services/price-list.service";
import { Copy, Loader2 } from "lucide-react";

const copySchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
});

interface CopyPriceListDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    priceList: PriceList | null;
    onSuccess: (newPriceList: PriceList) => void;
}

export function CopyPriceListDialog({
    open,
    onOpenChange,
    priceList,
    onSuccess,
}: CopyPriceListDialogProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof copySchema>>({
        resolver: zodResolver(copySchema),
        defaultValues: {
            name: "",
        },
    });

    // Reset form when dialog opens or priceList changes
    useEffect(() => {
        if (open && priceList) {
            form.reset({
                name: `Copy of ${priceList.name}`,
            });
        }
    }, [open, priceList, form]);

    async function onSubmit(data: z.infer<typeof copySchema>) {
        if (!priceList) return;

        setLoading(true);
        try {
            const newPriceList = await priceListService.duplicate(priceList.id, data.name);
            form.reset();
            onOpenChange(false);
            onSuccess(newPriceList);
        } catch (error: any) {
            console.error("Failed to duplicate price list", error);
            alert(error.response?.data?.message || "Failed to duplicate price list. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Copy className="h-5 w-5 text-primary" />
                        Copy Price List
                    </DialogTitle>
                    <DialogDescription>
                        Create a copy of "{priceList?.name}" with all its items. You can modify the prices later.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Price List Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter name for the copied price list"
                                            {...field}
                                            disabled={loading}
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
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Copying...
                                    </>
                                ) : (
                                    <>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy Price List
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

