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
import { invoiceService, Invoice, AddInvoiceItemRequest } from "@/lib/api/services/invoice.service";
import { priceListService, PriceList, PriceListItem } from "@/lib/api/services/price-list.service";
import { useState, useEffect } from "react";
import { Plus, X, Search, Percent, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const invoiceItemSchema = z.object({
    description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unit_price: z.number().min(0, "Unit price must be 0 or greater"),
    discount: z.number().min(0, "Discount must be 0 or greater").optional(),
    price_list_item_id: z.number().optional(),
});

interface AddInvoiceItemFormProps {
    invoice: Invoice;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function AddInvoiceItemForm({ invoice, onSuccess, onCancel }: AddInvoiceItemFormProps) {
    const [loading, setLoading] = useState(false);
    const [priceLists, setPriceLists] = useState<PriceList[]>([]);
    const [selectedPriceListId, setSelectedPriceListId] = useState<number | null>(null);
    const [priceListItems, setPriceListItems] = useState<PriceListItem[]>([]);
    const [loadingPriceLists, setLoadingPriceLists] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [itemDiscountType, setItemDiscountType] = useState<'fixed' | 'percentage'>('fixed');
    const [itemDiscountValue, setItemDiscountValue] = useState<number>(0);

    const form = useForm<AddInvoiceItemRequest>({
        resolver: zodResolver(invoiceItemSchema),
        defaultValues: {
            description: '',
            quantity: 1,
            unit_price: 0,
            discount: 0,
            price_list_item_id: undefined,
        },
    });

    // Load price lists on mount
    useEffect(() => {
        loadPriceLists();
    }, []);

    // Load items when price list is selected
    useEffect(() => {
        if (selectedPriceListId) {
            loadPriceListItems(selectedPriceListId);
        } else {
            setPriceListItems([]);
        }
    }, [selectedPriceListId]);

    const loadPriceLists = async () => {
        setLoadingPriceLists(true);
        try {
            const data = await priceListService.getAll(1, 100);
            const lists = Array.isArray(data) ? data : (data as any).data || [];
            setPriceLists(lists);
            // Auto-select first price list if available
            if (lists.length > 0 && !selectedPriceListId) {
                setSelectedPriceListId(lists[0].id);
            }
        } catch (error) {
            console.error("Failed to load price lists", error);
        } finally {
            setLoadingPriceLists(false);
        }
    };

    const loadPriceListItems = async (priceListId: number) => {
        setLoadingItems(true);
        try {
            const priceList = await priceListService.getById(priceListId);
            const items = priceList.items || [];
            setPriceListItems(items);
        } catch (error) {
            console.error("Failed to load price list items", error);
            setPriceListItems([]);
        } finally {
            setLoadingItems(false);
        }
    };

    const handlePriceListItemSelect = (itemId: string) => {
        const item = priceListItems.find(i => i.id === Number(itemId));
        if (item) {
            const price = item.price != null ? Number(item.price) : 0;
            form.setValue('price_list_item_id', item.id);
            form.setValue('description', item.description || item.name);
            form.setValue('unit_price', price);
            form.setValue('quantity', 1);
        }
    };

    const quantity = form.watch('quantity');
    const unitPrice = form.watch('unit_price');
    const selectedPriceListItemId = form.watch('price_list_item_id');
    const subtotal = quantity * unitPrice;
    
    // Calculate discount based on type
    const calculateItemDiscount = () => {
        if (itemDiscountValue <= 0) return 0;
        if (itemDiscountType === 'percentage') {
            return subtotal * (itemDiscountValue / 100);
        }
        return itemDiscountValue;
    };
    
    const itemDiscount = calculateItemDiscount();
    const total = subtotal - itemDiscount;
    
    // Update form discount value when calculated discount changes
    useEffect(() => {
        form.setValue('discount', itemDiscount);
    }, [itemDiscount]); // eslint-disable-line react-hooks/exhaustive-deps

    const filteredItems = priceListItems.filter(item => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            item.name?.toLowerCase().includes(search) ||
            item.description?.toLowerCase().includes(search) ||
            item.service_type?.toLowerCase().includes(search)
        );
    });

    async function onSubmit(data: AddInvoiceItemRequest) {
        setLoading(true);
        try {
            // Filter out undefined values
            const payload: AddInvoiceItemRequest = {
                description: data.description,
                quantity: data.quantity,
                unit_price: data.unit_price,
                discount: data.discount ?? 0, // Always include discount
            };
            if (data.price_list_item_id !== undefined) {
                payload.price_list_item_id = data.price_list_item_id;
            }
            if (data.booking_dive_id !== undefined) {
                payload.booking_dive_id = data.booking_dive_id;
            }
            if (data.booking_equipment_id !== undefined) {
                payload.booking_equipment_id = data.booking_equipment_id;
            }
            
            await invoiceService.addItem(invoice.id, payload);
            form.reset({
                description: '',
                quantity: 1,
                unit_price: 0,
                discount: 0,
                price_list_item_id: undefined,
            });
            setItemDiscountType('fixed');
            setItemDiscountValue(0);
            setSearchTerm("");
            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error("Failed to add item to invoice", error);
            const errorMessage = error?.response?.data?.message || error?.response?.data?.error || "Failed to add item to invoice";
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    Add Item to Invoice
                </CardTitle>
                <CardDescription>
                    Add a new item to invoice {invoice.invoice_no || `#${invoice.id}`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Price List Selection */}
                        <div className="space-y-2">
                            <FormLabel className="text-base font-semibold">Price List</FormLabel>
                            <Select
                                value={selectedPriceListId?.toString() || ""}
                                onValueChange={(value) => {
                                    setSelectedPriceListId(Number(value));
                                    form.setValue('price_list_item_id', undefined);
                                    form.setValue('description', '');
                                    form.setValue('unit_price', 0);
                                    setSearchTerm("");
                                }}
                                disabled={loadingPriceLists}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingPriceLists ? "Loading price lists..." : "Select a price list"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {priceLists.map((list) => (
                                        <SelectItem key={list.id} value={list.id.toString()}>
                                            {list.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                                Select a price list to choose items from
                            </p>
                        </div>

                        {/* Price List Item Selection */}
                        {selectedPriceListId && (
                            <div className="space-y-2">
                                <FormLabel className="text-base font-semibold">Item from Price List (Optional)</FormLabel>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search items..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Select
                                        value={selectedPriceListItemId?.toString() || ""}
                                        onValueChange={handlePriceListItemSelect}
                                        disabled={loadingItems}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={loadingItems ? "Loading items..." : "Select an item (optional)"}>
                                                {selectedPriceListItemId ? (() => {
                                                    const selectedItem = priceListItems.find(i => i.id === selectedPriceListItemId);
                                                    return selectedItem ? selectedItem.name : "Select an item (optional)";
                                                })() : "Select an item (optional)"}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {filteredItems.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-muted-foreground">
                                                    {searchTerm ? "No items found matching your search" : "No items available in this price list"}
                                                </div>
                                            ) : (
                                                filteredItems
                                                    .filter(item => item.is_active !== false)
                                                    .map((item) => {
                                                        const price = item.price != null ? Number(item.price) : 0;
                                                        return (
                                                            <SelectItem key={item.id} value={item.id.toString()}>
                                                                <div className="flex flex-col w-full">
                                                                    <span className="font-medium">{item.name}</span>
                                                                    {item.description && (
                                                                        <span className="text-xs text-muted-foreground line-clamp-2">{item.description}</span>
                                                                    )}
                                                                    <span className="text-xs text-muted-foreground mt-1">${price.toFixed(2)}</span>
                                                                </div>
                                                            </SelectItem>
                                                        );
                                                    })
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Select an item to auto-fill description and price, or enter manually below
                                </p>
                            </div>
                        )}

                        {/* Manual Entry Fields */}
                        <div className="space-y-4 pt-2 border-t">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-semibold">Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter item description"
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="1"
                                                min="1"
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="unit_price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit Price</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            </div>

                            <div className="space-y-2">
                                <FormLabel>Item Discount</FormLabel>
                                <div className="flex gap-2">
                                    <Select
                                        value={itemDiscountType}
                                        onValueChange={(value: 'fixed' | 'percentage') => {
                                            setItemDiscountType(value);
                                            setItemDiscountValue(0);
                                        }}
                                    >
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fixed">
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="h-4 w-4" />
                                                    <span>Fixed Amount</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="percentage">
                                                <div className="flex items-center gap-2">
                                                    <Percent className="h-4 w-4" />
                                                    <span>Percentage</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="relative flex-1">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max={itemDiscountType === 'percentage' ? 100 : undefined}
                                            value={itemDiscountValue === 0 ? '' : itemDiscountValue.toString()}
                                            onChange={(e) => {
                                                const inputValue = e.target.value;
                                                if (inputValue === '' || inputValue === '.') {
                                                    setItemDiscountValue(0);
                                                    return;
                                                }
                                                const numericValue = parseFloat(inputValue);
                                                if (!isNaN(numericValue) && numericValue >= 0) {
                                                    if (itemDiscountType === 'percentage' && numericValue > 100) {
                                                        return;
                                                    }
                                                    setItemDiscountValue(numericValue);
                                                }
                                            }}
                                            placeholder={itemDiscountType === 'percentage' ? "0.00" : "0.00"}
                                            className={itemDiscountType === 'percentage' ? 'pl-9' : 'pl-9'}
                                        />
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            {itemDiscountType === 'percentage' ? (
                                                <Percent className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {itemDiscountType === 'percentage' && itemDiscountValue > 0 && subtotal > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Discount: ${itemDiscount.toFixed(2)} ({itemDiscountValue}% of ${subtotal.toFixed(2)})
                                    </p>
                                )}
                                {itemDiscountType === 'fixed' && itemDiscountValue > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Discount: ${itemDiscount.toFixed(2)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {subtotal > 0 && (
                            <div className="p-4 bg-muted/50 rounded-lg border space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Subtotal:</span>
                                    <span className="text-sm">${Number(subtotal).toFixed(2)}</span>
                                </div>
                                {itemDiscount > 0 && (
                                    <div className="flex justify-between items-center text-green-600">
                                        <span className="text-sm font-medium">Discount:</span>
                                        <span className="text-sm">-${Number(itemDiscount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center border-t pt-2">
                                    <span className="text-sm font-medium">Line Total:</span>
                                    <span className="text-xl font-bold">${Number(total).toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            {onCancel && (
                                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                </Button>
                            )}
                            <Button type="submit" disabled={loading || total <= 0}>
                                <Plus className="h-4 w-4 mr-2" />
                                {loading ? "Adding..." : "Add Item"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
