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
import { Calendar, MapPin, Clock, DollarSign, User, Trash2 } from "lucide-react";
import { SafeDatePicker as DatePicker } from "@/components/ui/safe-date-picker";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";

const bookingExcursionSchema = z.object({
    booking_id: z.string().optional(),
    customer_id: z.string().optional(),
    customer_ids: z.array(z.string()).optional(),
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
    return data.booking_id || data.customer_id || data.dive_group_id || (data.customer_ids && data.customer_ids.length > 0);
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
    const [memberParticipantCounts, setMemberParticipantCounts] = useState<Record<number, number>>({});
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
            customer_ids: [],
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
    const numberOfParticipants = form.watch('number_of_participants');

    useEffect(() => {
        if (priceListItemId) {
            const item = priceListItems.find(p => String(p.id) === priceListItemId);
            if (item) {
                const basePrice = item.base_price || item.price;
                const qty = parseInt(numberOfParticipants || "1", 10);
                const totalPrice = basePrice * (isNaN(qty) ? 1 : qty);
                form.setValue('price', String(totalPrice.toFixed(2)));
            }
        }
    }, [priceListItemId, numberOfParticipants, priceListItems, form]);

    const excursionId = form.watch('excursion_id');
    useEffect(() => {
        if (excursionId && !initialData?.id) {
            // Find the selected excursion
            const excursion = excursions.find(e => String(e.id) === excursionId);
            if (excursion) {
                // Try to find a matching price list item by name
                const matchingPriceItem = priceListItems.find(p => 
                    p.name.toLowerCase() === excursion.name.toLowerCase() || 
                    p.name.toLowerCase().includes(excursion.name.toLowerCase())
                );
                
                if (matchingPriceItem) {
                    form.setValue('price_list_item_id', String(matchingPriceItem.id));
                }
            }
        }
    }, [excursionId, excursions, priceListItems, form, initialData]);

    const diveGroupId = form.watch('dive_group_id');
    const selectedDiveGroup = diveGroups.find(g => String(g.id) === diveGroupId);

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
            } else if (createMode === 'quick') {
                if (data.customer_ids && data.customer_ids.length > 0) {
                    (payload as any).customer_ids = data.customer_ids.map(id => parseInt(id));
                    (payload as any).member_participant_counts = memberParticipantCounts;
                } else if (data.customer_id) {
                    payload.customer_id = parseInt(data.customer_id);
                }
                payload.booking_date = data.booking_date || data.excursion_date || undefined;
            } else if (createMode === 'group' && data.dive_group_id) {
                payload.dive_group_id = parseInt(data.dive_group_id);
                payload.booking_date = data.booking_date || data.excursion_date || undefined;
                if (selectedDiveGroup && selectedDiveGroup.members) {
                    (payload as any).member_participant_counts = {};
                    selectedDiveGroup.members.forEach((member) => {
                        (payload as any).member_participant_counts[member.id] = memberParticipantCounts[member.id] || 1;
                    });
                }
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
                                    onClick={() => {
                                        setCreateMode('quick');
                                        form.setValue('booking_id', '');
                                        form.setValue('dive_group_id', '');
                                    }}
                                >
                                    Quick Booking
                                </Button>
                                <Button
                                    type="button"
                                    variant={createMode === 'group' ? 'default' : 'outline'}
                                    onClick={() => {
                                        setCreateMode('group');
                                        form.setValue('booking_id', '');
                                        form.setValue('customer_id', '');
                                        form.setValue('customer_ids', []);
                                        setMemberParticipantCounts({});
                                    }}
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
                                <div className="space-y-3">
                                    <FormLabel className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-primary" />
                                        Select Participants (Walk-in Group)
                                    </FormLabel>
                                    
                                    {/* List of selected participants */}
                                    <div className="grid gap-3 min-h-[40px]">
                                        {(form.watch('customer_ids') || []).length === 0 && (
                                            <div className="p-3 bg-muted/30 rounded-md border border-dashed text-sm text-muted-foreground italic">
                                                No participants selected. Add at least one participant below.
                                            </div>
                                        )}
                                        {form.watch('customer_ids')?.map(id => {
                                            const customer = customers.find(c => String(c.id) === id);
                                            return (
                                                <div key={id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                                    <div className="flex items-center gap-3">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">{customer?.full_name}</p>
                                                            <p className="text-xs text-muted-foreground">{customer?.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            className="w-20 h-8"
                                                            value={memberParticipantCounts[Number(id)] || 1}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value) || 1;
                                                                setMemberParticipantCounts(prev => ({
                                                                    ...prev,
                                                                    [Number(id)]: val
                                                                }));
                                                            }}
                                                        />
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                            participant{memberParticipantCounts[Number(id)] !== 1 ? 's' : ''}
                                                        </span>
                                                        <Button 
                                                            type="button" 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 ml-2 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                                            onClick={() => {
                                                                const current = form.getValues('customer_ids') || [];
                                                                form.setValue('customer_ids', current.filter(cid => cid !== id));
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <SearchableSelect
                                        options={customers.map((customer) => ({
                                            value: String(customer.id),
                                            label: customer.full_name,
                                            searchTerms: `${customer.full_name} ${customer.email || ""} ${customer.passport_no || ""}`
                                        }))}
                                        onValueChange={(value) => {
                                            const current = form.getValues('customer_ids') || [];
                                            if (!current.includes(value)) {
                                                form.setValue('customer_ids', [...current, value]);
                                                if (current.length === 0) form.setValue('customer_id', value);
                                            }
                                        }}
                                        placeholder="Add participant..."
                                        searchPlaceholder="Search by name, email or passport..."
                                    />
                                    <FormMessage />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="booking_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Booking Date</FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    selected={field.value ? new Date(field.value) : undefined}
                                                    onChange={(date) => {
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
                            <div className="space-y-6">
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

                                {selectedDiveGroup && (
                                    <div className="space-y-4 pt-4 border-t">
                                        <FormLabel>Group Members & Participants</FormLabel>
                                        <div className="grid gap-3">
                                            {selectedDiveGroup.members?.map((member) => (
                                                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                                    <div className="flex items-center gap-3">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">{member.full_name}</p>
                                                            <p className="text-xs text-muted-foreground">{member.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            className="w-20 h-8"
                                                            value={memberParticipantCounts[member.id] || 1}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value) || 1;
                                                                setMemberParticipantCounts(prev => ({
                                                                    ...prev,
                                                                    [member.id]: val
                                                                }));
                                                            }}
                                                        />
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                            participant{memberParticipantCounts[member.id] !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Total participants: {selectedDiveGroup.members?.reduce((sum, member) => sum + (memberParticipantCounts[member.id] || 1), 0) || 0}
                                        </p>
                                    </div>
                                )}
                            </div>
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
                                                selected={field.value ? new Date(field.value) : undefined}
                                                onChange={(date) => {
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
