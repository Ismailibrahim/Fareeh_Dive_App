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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { bookingExcursionService, BookingExcursionFormData, BookingExcursion } from "@/lib/api/services/booking-excursion.service";
import { bookingService, Booking } from "@/lib/api/services/booking.service";
import { customerService, Customer } from "@/lib/api/services/customer.service";
import { excursionService, Excursion } from "@/lib/api/services/excursion.service";
import { priceListItemService } from "@/lib/api/services/price-list-item.service";
import { PriceListItem } from "@/lib/api/services/price-list.service";
import { diveGroupService, DiveGroup } from "@/lib/api/services/dive-group.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Clock, DollarSign, User } from "lucide-react";
import { SafeDatePicker as DatePicker } from "@/components/ui/safe-date-picker";

const bookingExcursionSchema = z.object({
    booking_id: z.string().optional(),
    customer_id: z.string().optional(),
    dive_group_id: z.string().optional(),
    booking_date: z.string().optional(),
    number_of_participants: z.string().optional(),
    excursion_id: z.string().min(1, "Excursion is required"),
    excursion_date: z.string().optional().or(z.literal("")),
    excursion_time: z.string().optional().or(z.literal("")),
    price_list_item_id: z.string().optional(),
    price: z.string().optional(),
    status: z.enum(['Scheduled', 'In Progress', 'Completed', 'Cancelled']).optional(),
    notes: z.string().optional(),
}).refine((data) => {
    return data.booking_id || data.customer_id || data.dive_group_id;
}, {
    message: "Either select an existing booking, provide customer for quick booking, or select a dive group",
    path: ["booking_id"],
});

interface BookingExcursionFormProps {
    initialData?: BookingExcursion;
    bookingExcursionId?: string | number;
}

export function BookingExcursionForm({ initialData, bookingExcursionId }: BookingExcursionFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [createMode, setCreateMode] = useState<'existing' | 'quick' | 'group'>('existing');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [diveGroups, setDiveGroups] = useState<DiveGroup[]>([]);
    const [excursions, setExcursions] = useState<Excursion[]>([]);
    const [priceListItems, setPriceListItems] = useState<PriceListItem[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const bookingData = await bookingService.getAll();
                const bookingList = Array.isArray(bookingData) ? bookingData : (bookingData as any).data || [];
                setBookings(bookingList);

                const customerData = await customerService.getAll();
                const customerList = Array.isArray(customerData) ? customerData : (customerData as any).data || [];
                setCustomers(customerList);

                const diveGroupData = await diveGroupService.getAll({ status: 'Active' });
                const diveGroupList = Array.isArray(diveGroupData) ? diveGroupData : (diveGroupData as any).data || [];
                setDiveGroups(diveGroupList);

                const excursionData = await excursionService.getAll();
                const excursionList = Array.isArray(excursionData) ? excursionData : (excursionData as any).data || [];
                setExcursions(excursionList.filter((e: Excursion) => e.is_active));

                const priceData = await priceListItemService.getAll({ service_type: 'Excursion Trip', is_active: true });
                setPriceListItems(Array.isArray(priceData) ? priceData : []);
            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (initialData?.booking_id) {
            setCreateMode('existing');
        } else if (!initialData && !bookingExcursionId) {
            setCreateMode('existing');
        }
    }, [initialData, bookingExcursionId]);

    type BookingExcursionFormValues = z.infer<typeof bookingExcursionSchema>;
    
    const form = useForm<BookingExcursionFormValues>({
        resolver: zodResolver(bookingExcursionSchema),
        defaultValues: {
            booking_id: initialData?.booking_id ? String(initialData.booking_id) : "",
            customer_id: "",
            dive_group_id: "",
            booking_date: "",
            number_of_participants: initialData?.number_of_participants ? String(initialData.number_of_participants) : "1",
            excursion_id: initialData?.excursion_id ? String(initialData.excursion_id) : "",
            excursion_date: initialData?.excursion_date ? initialData.excursion_date.split('T')[0] : "",
            excursion_time: initialData?.excursion_time || "",
            price_list_item_id: initialData?.price_list_item_id ? String(initialData.price_list_item_id) : "",
            price: initialData?.price ? String(initialData.price) : "",
            status: initialData?.status || 'Scheduled',
            notes: initialData?.notes || "",
        },
    });

    const priceListItemId = form.watch('price_list_item_id');
    useEffect(() => {
        if (priceListItemId) {
            const item = priceListItems.find(p => String(p.id) === priceListItemId);
            if (item) {
                const price = item.base_price || item.price;
                form.setValue('price', String(price));
            }
        }
    }, [priceListItemId, priceListItems, form]);

    async function onSubmit(data: BookingExcursionFormValues) {
        setLoading(true);
        try {
            const payload: BookingExcursionFormData = {
                excursion_id: parseInt(data.excursion_id),
                excursion_date: data.excursion_date || undefined,
                excursion_time: data.excursion_time || undefined,
                price_list_item_id: data.price_list_item_id ? parseInt(data.price_list_item_id) : undefined,
                price: data.price ? parseFloat(data.price) : undefined,
                status: data.status,
                notes: data.notes || undefined,
                number_of_participants: data.number_of_participants ? parseInt(data.number_of_participants) : 1,
            };

            if (createMode === 'existing' && data.booking_id) {
                payload.booking_id = parseInt(data.booking_id);
            } else if (createMode === 'quick' && data.customer_id) {
                payload.customer_id = parseInt(data.customer_id);
                payload.booking_date = data.booking_date || data.excursion_date || undefined;
            } else if (createMode === 'group' && data.dive_group_id) {
                payload.dive_group_id = parseInt(data.dive_group_id);
                payload.booking_date = data.booking_date || data.excursion_date || undefined;
            }

            if (bookingExcursionId) {
                await bookingExcursionService.update(Number(bookingExcursionId), payload);
                router.push("/dashboard/booking-excursions");
                router.refresh();
            } else {
                await bookingExcursionService.create(payload);
                router.push("/dashboard/booking-excursions");
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to save booking excursion", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {!initialData && !bookingExcursionId && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Booking Mode
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    variant={createMode === 'existing' ? 'default' : 'outline'}
                                    onClick={() => setCreateMode('existing')}
                                >
                                    Existing Booking
                                </Button>
                                <Button
                                    type="button"
                                    variant={createMode === 'quick' ? 'default' : 'outline'}
                                    onClick={() => setCreateMode('quick')}
                                >
                                    Quick Booking
                                </Button>
                                <Button
                                    type="button"
                                    variant={createMode === 'group' ? 'default' : 'outline'}
                                    onClick={() => setCreateMode('group')}
                                >
                                    Group Booking
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Booking Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {createMode === 'existing' && (
                            <FormField
                                control={form.control}
                                name="booking_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Booking</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select booking" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {bookings.map((booking) => (
                                                    <SelectItem key={booking.id} value={String(booking.id)}>
                                                        {booking.customer?.full_name} - {booking.booking_date}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {createMode === 'quick' && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="customer_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Customer</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
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
                                    name="booking_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Booking Date</FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    date={field.value ? new Date(field.value) : undefined}
                                                    onSelect={(date) => {
                                                        field.onChange(date ? date.toISOString().split('T')[0] : '');
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {createMode === 'group' && (
                            <FormField
                                control={form.control}
                                name="dive_group_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dive Group</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select dive group" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {diveGroups.map((group) => (
                                                    <SelectItem key={group.id} value={String(group.id)}>
                                                        {group.group_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Excursion Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="excursion_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Excursion *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select excursion" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {excursions.map((excursion) => (
                                                <SelectItem key={excursion.id} value={String(excursion.id)}>
                                                    {excursion.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="excursion_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Excursion Date
                                        </FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                date={field.value ? new Date(field.value) : undefined}
                                                onSelect={(date) => {
                                                    field.onChange(date ? date.toISOString().split('T')[0] : '');
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="excursion_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Excursion Time
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="number_of_participants"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Number of Participants
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="number" min="1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            Pricing
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="price_list_item_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price List Item</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select price list item" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {priceListItems.map((item) => (
                                                <SelectItem key={item.id} value={String(item.id)}>
                                                    {item.name} - ${item.base_price || item.price}
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
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Scheduled">Scheduled</SelectItem>
                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Additional notes..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/dashboard/booking-excursions")}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : bookingExcursionId ? "Update Booking" : "Create Booking"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
