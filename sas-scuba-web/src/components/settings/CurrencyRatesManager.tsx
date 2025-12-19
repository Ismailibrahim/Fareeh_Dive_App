"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { currencyService } from "@/lib/api/services/currency.service";
import { Plus, Pencil, Trash2, DollarSign } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { isValidCurrencyCode } from "@/lib/utils/currency";

const currencyRateSchema = z.object({
    currency: z.string().min(3).max(3).refine((val) => isValidCurrencyCode(val), {
        message: "Currency code must be 3 uppercase letters",
    }),
    rate: z.number().min(0.0001, "Rate must be greater than 0"),
});

interface CurrencyRate {
    currency: string;
    rate: number;
}

export function CurrencyRatesManager() {
    const [rates, setRates] = useState<Record<string, number>>({});
    const [baseCurrency, setBaseCurrency] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCurrency, setEditingCurrency] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [currencyToDelete, setCurrencyToDelete] = useState<string | null>(null);

    const form = useForm<{ currency: string; rate: number }>({
        resolver: zodResolver(currencyRateSchema),
        defaultValues: {
            currency: "",
            rate: 1,
        },
    });

    const fetchRates = async () => {
        setLoading(true);
        try {
            const data = await currencyService.getCurrencyRates();
            setRates(data.currency_rates || {});
            setBaseCurrency(data.base_currency || "");
        } catch (error) {
            console.error("Failed to fetch currency rates", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRates();
    }, []);

    const handleAdd = () => {
        setEditingCurrency(null);
        form.reset({ currency: "", rate: 1 });
        setDialogOpen(true);
    };

    const handleEdit = (currency: string) => {
        setEditingCurrency(currency);
        form.reset({ currency, rate: rates[currency] });
        setDialogOpen(true);
    };

    const handleDeleteClick = (currency: string) => {
        setCurrencyToDelete(currency);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!currencyToDelete) return;

        const newRates = { ...rates };
        delete newRates[currencyToDelete];

        try {
            await currencyService.updateCurrencyRates(newRates);
            await fetchRates();
            setDeleteDialogOpen(false);
            setCurrencyToDelete(null);
        } catch (error) {
            console.error("Failed to delete currency rate", error);
        }
    };

    const onSubmit = async (data: { currency: string; rate: number }) => {
        try {
            const newRates = { ...rates };
            newRates[data.currency.toUpperCase()] = data.rate;
            await currencyService.updateCurrencyRates(newRates);
            await fetchRates();
            setDialogOpen(false);
            form.reset();
        } catch (error) {
            console.error("Failed to save currency rate", error);
        }
    };

    const ratesList: CurrencyRate[] = Object.entries(rates)
        .map(([currency, rate]) => ({ currency, rate }))
        .sort((a, b) => a.currency.localeCompare(b.currency));

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Currency Conversion Rates</h3>
                        <p className="text-sm text-muted-foreground">
                            Set exchange rates relative to your base currency ({baseCurrency || "USD"}).
                        </p>
                    </div>
                    <Button onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" /> Add Currency
                    </Button>
                </div>

                {baseCurrency && (
                    <div className="p-4 bg-muted rounded-md flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Base Currency:</span>
                        <span className="font-medium">{baseCurrency}</span>
                        <span className="text-sm text-muted-foreground">(Rate: 1.0)</span>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Currency Code</TableHead>
                                    <TableHead>Exchange Rate</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ratesList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                            No currency rates configured. Add currencies to enable conversion.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    ratesList.map((rate) => (
                                        <TableRow key={rate.currency}>
                                            <TableCell className="font-medium">{rate.currency}</TableCell>
                                            <TableCell>{rate.rate.toFixed(4)}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(rate.currency)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        {rate.currency !== baseCurrency && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteClick(rate.currency)}
                                                                className="text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCurrency ? "Edit Currency Rate" : "Add Currency Rate"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCurrency
                                ? "Update the exchange rate for this currency."
                                : "Add a new currency and its exchange rate relative to your base currency."}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="currency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Currency Code</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="USD"
                                                maxLength={3}
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                disabled={!!editingCurrency}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="rate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Exchange Rate {baseCurrency && `(1 ${baseCurrency} = ? ${form.watch("currency") || "XXX"})`}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.0001"
                                                min="0.0001"
                                                placeholder="1.0000"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                value={field.value || ""}
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
                                    onClick={() => setDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingCurrency ? "Update" : "Add"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the exchange rate for {currencyToDelete}. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

