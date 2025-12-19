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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { divePackageService, DivePackageFormData } from "@/lib/api/services/dive-package.service";
import { customerService, Customer } from "@/lib/api/services/customer.service";
import { priceListItemService, PriceListItem } from "@/lib/api/services/price-list-item.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, User, DollarSign, Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import { cn } from "@/lib/utils";

const packageSchema = z.object({
    customer_id: z.string().min(1, "Customer is required"),
    package_price_list_item_id: z.string().min(1, "Package price list item is required"),
    package_total_price: z.string().min(1, "Total price is required"),
    package_total_dives: z.string().min(1, "Total dives is required"),
    package_duration_days: z.string().min(1, "Duration days is required"),
    package_start_date: z.string().min(1, "Start date is required"),
    package_end_date: z.string().optional(),
    create_bookings_now: z.boolean().optional(),
    notes: z.string().optional(),
});

export default function CreateDivePackagePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [priceListItems, setPriceListItems] = useState<PriceListItem[]>([]);
    const [selectedPriceItem, setSelectedPriceItem] = useState<PriceListItem | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const customerData = await customerService.getAll();
                const customerList = Array.isArray(customerData) ? customerData : (customerData as any).data || [];
                setCustomers(customerList);

                const priceData = await priceListItemService.getAll({ service_type: 'Dive Package', is_active: true });
                setPriceListItems(Array.isArray(priceData) ? priceData : []);
            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        fetchData();
    }, []);

    const form = useForm<DivePackageFormData>({
        resolver: zodResolver(packageSchema),
        defaultValues: {
            customer_id: "",
            package_price_list_item_id: "",
            package_total_price: "",
            package_total_dives: "",
            package_duration_days: "",
            package_start_date: "",
            package_end_date: "",
            create_bookings_now: false,
            notes: "",
        },
    });

    // Watch price list item to auto-populate price
    const priceListItemId = form.watch('package_price_list_item_id');
    useEffect(() => {
        if (priceListItemId) {
            const item = priceListItems.find(p => String(p.id) === priceListItemId);
            if (item) {
                setSelectedPriceItem(item);
                form.setValue('package_total_price', String(item.price));
            }
        } else {
            setSelectedPriceItem(null);
        }
    }, [priceListItemId, priceListItems, form]);

    // Calculate per-dive price
    const totalPrice = parseFloat(form.watch('package_total_price') || '0');
    const totalDives = parseFloat(form.watch('package_total_dives') || '0');
    const perDivePrice = totalDives > 0 ? totalPrice / totalDives : 0;

    const parseDate = (dateString: string | undefined): Date | null => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    };

    const formatDateToString = (date: Date | null): string => {
        if (!date) return "";
        return date.toISOString().split('T')[0];
    };

    async function onSubmit(data: z.infer<typeof packageSchema>) {
        setLoading(true);
        try {
            const payload: DivePackageFormData = {
                customer_id: parseInt(data.customer_id),
                package_price_list_item_id: parseInt(data.package_price_list_item_id),
                package_total_price: parseFloat(data.package_total_price),
                package_total_dives: parseInt(data.package_total_dives),
                package_duration_days: parseInt(data.package_duration_days),
                package_start_date: data.package_start_date,
                package_end_date: data.package_end_date || undefined,
                create_bookings_now: data.create_bookings_now || false,
                notes: data.notes || undefined,
            };

            await divePackageService.create(payload);
            router.push("/dashboard/dive-packages");
            router.refresh();
        } catch (error) {
            console.error("Failed to create package", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Create Dive Package</h1>
                <p className="text-muted-foreground">Create a new dive package for a customer</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Customer & Package Selection
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="customer_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Customer</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select customer" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {customers.map((customer) => (
                                                    <SelectItem key={customer.id} value={String(customer.id)}>
                                                        {customer.full_name}
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
                                name="package_price_list_item_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Package</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select package" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {priceListItems.map((item) => (
                                                    <SelectItem key={item.id} value={String(item.id)}>
                                                        {item.name} - ${item.price}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            {selectedPriceItem && selectedPriceItem.description}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                Package Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="package_total_price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total Price</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input type="number" step="0.01" min="0" className="pl-9" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="package_total_dives"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total Dives</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {perDivePrice > 0 && (
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm font-medium">Per-Dive Price: ${perDivePrice.toFixed(2)}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="package_duration_days"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Duration (Days)</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="package_start_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Start Date</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                    <DatePicker
                                                        selected={parseDate(field.value)}
                                                        onChange={(date) => field.onChange(formatDateToString(date))}
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
                            </div>

                            <FormField
                                control={form.control}
                                name="package_end_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>End Date (Optional)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                <DatePicker
                                                    selected={parseDate(field.value)}
                                                    onChange={(date) => field.onChange(formatDateToString(date))}
                                                    dateFormat="PPP"
                                                    placeholderText="Pick a date (optional)"
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
                                name="create_bookings_now"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Create bookings for all days now</FormLabel>
                                            <FormDescription>
                                                If checked, bookings will be created for each day of the package duration
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Add any additional notes about this package..."
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
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Package"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}

