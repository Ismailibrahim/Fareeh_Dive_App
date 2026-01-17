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
import { bookingDiveService, BookingDiveFormData, BookingDive } from "@/lib/api/services/booking-dive.service";
import { bookingService, Booking } from "@/lib/api/services/booking.service";
import { customerService, Customer } from "@/lib/api/services/customer.service";
import { diveSiteService, DiveSite } from "@/lib/api/services/dive-site.service";
import { boatService, Boat } from "@/lib/api/services/boat.service";
import { priceListItemService } from "@/lib/api/services/price-list-item.service";
import { PriceListItem } from "@/lib/api/services/price-list.service";
import { diveGroupService, DiveGroup } from "@/lib/api/services/dive-group.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Ship, Clock, CalendarIcon, DollarSign, User, FileText } from "lucide-react";
import { SafeDatePicker as DatePicker } from "@/components/ui/safe-date-picker";
import { cn } from "@/lib/utils";
import { safeFormatDate } from "@/lib/utils/date-format";
import { PriceSuggestionDropdown } from "@/components/price-list/PriceSuggestionDropdown";
import { PriceSuggestion } from "@/lib/api/services/price-list.service";

const bookingDiveSchema = z.object({
    booking_id: z.string().optional(),
    customer_id: z.string().optional(),
    dive_group_id: z.string().optional(),
    booking_date: z.string().optional(),
    number_of_divers: z.string().optional(),
    dive_site_id: z.string().min(1, "Dive site is required"),
    boat_id: z.string().optional().or(z.literal("")),
    dive_date: z.string().optional().or(z.literal("")),
    dive_time: z.string().optional().or(z.literal("")),
    price_list_item_id: z.string().optional(),
    price: z.string().optional(),
    dive_duration: z.string().optional(),
    max_depth: z.string().optional(),
    status: z.enum(['Scheduled', 'In Progress', 'Completed', 'Cancelled']).optional(),
    dive_log_notes: z.string().optional(),
}).refine((data) => {
    // Either booking_id, customer_id, or dive_group_id must be provided
    return data.booking_id || data.customer_id || data.dive_group_id;
}, {
    message: "Either select an existing booking, provide customer for quick booking, or select a dive group",
    path: ["booking_id"],
});

interface BookingDiveFormProps {
    initialData?: BookingDive;
    bookingDiveId?: string | number;
}

export function BookingDiveForm({ initialData, bookingDiveId }: BookingDiveFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [createMode, setCreateMode] = useState<'existing' | 'quick' | 'group'>('existing');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [diveGroups, setDiveGroups] = useState<DiveGroup[]>([]);
    const [diveSites, setDiveSites] = useState<DiveSite[]>([]);
    const [boats, setBoats] = useState<Boat[]>([]);
    const [priceListItems, setPriceListItems] = useState<PriceListItem[]>([]);
    const [selectedPriceItem, setSelectedPriceItem] = useState<PriceListItem | null>(null);
    const [diveCount, setDiveCount] = useState<number>(0);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [selectedDiveGroup, setSelectedDiveGroup] = useState<DiveGroup | null>(null);
    const [memberDiverCounts, setMemberDiverCounts] = useState<Record<number, number>>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch bookings
                const bookingData = await bookingService.getAll();
                const bookingList = Array.isArray(bookingData) ? bookingData : (bookingData as any).data || [];
                setBookings(bookingList);

                // Fetch customers
                const customerData = await customerService.getAll();
                const customerList = Array.isArray(customerData) ? customerData : (customerData as any).data || [];
                setCustomers(customerList);

                // Fetch dive groups
                const diveGroupData = await diveGroupService.getAll({ status: 'Active' });
                const diveGroupList = Array.isArray(diveGroupData) ? diveGroupData : (diveGroupData as any).data || [];
                setDiveGroups(diveGroupList);

                // Fetch dive sites
                const diveSiteData = await diveSiteService.getAll();
                const diveSiteList = Array.isArray(diveSiteData) ? diveSiteData : (diveSiteData as any).data || [];
                setDiveSites(diveSiteList);

                // Fetch boats (only active ones)
                const boatData = await boatService.getAll(1, true);
                const boatList = Array.isArray(boatData) ? boatData : (boatData as any).data || [];
                setBoats(boatList);

                // Fetch price list items for dive trips
                const priceData = await priceListItemService.getAll({ service_type: 'Dive Trip', is_active: true });
                setPriceListItems(Array.isArray(priceData) ? priceData : []);
            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        fetchData();
    }, []);

    // Determine initial mode based on initialData
    useEffect(() => {
        if (initialData?.booking_id) {
            setCreateMode('existing');
        } else if (!initialData && !bookingDiveId) {
            setCreateMode('existing'); // Default to existing for new dives
        }
    }, [initialData, bookingDiveId]);

    // Form values type (strings from form inputs)
    type BookingDiveFormValues = z.infer<typeof bookingDiveSchema>;
    
    const form = useForm<BookingDiveFormValues>({
        resolver: zodResolver(bookingDiveSchema),
        defaultValues: {
            booking_id: initialData?.booking_id ? String(initialData.booking_id) : "",
            customer_id: "",
            dive_group_id: "",
            booking_date: "",
            number_of_divers: "",
            dive_site_id: initialData?.dive_site_id ? String(initialData.dive_site_id) : "",
            boat_id: initialData?.boat_id ? String(initialData.boat_id) : "none",
            dive_date: initialData?.dive_date ? initialData.dive_date.split('T')[0] : "",
            dive_time: initialData?.dive_time || "",
            price_list_item_id: initialData?.price_list_item_id ? String(initialData.price_list_item_id) : "",
            price: initialData?.price ? String(initialData.price) : "",
            dive_duration: initialData?.dive_duration ? String(initialData.dive_duration) : "",
            max_depth: initialData?.max_depth ? String(initialData.max_depth) : "",
            status: initialData?.status || 'Scheduled',
            dive_log_notes: initialData?.dive_log_notes || "",
        },
    });

    // Watch booking_id to calculate dive count
    const bookingId = form.watch('booking_id');
    useEffect(() => {
        const calculateDiveCount = async () => {
            if (bookingId) {
                try {
                    const booking = bookings.find(b => String(b.id) === bookingId);
                    if (booking) {
                        setSelectedBooking(booking);
                        // Fetch existing dives for this booking to get accurate count
                        try {
                            const diveResponse = await bookingDiveService.getAll(1);
                            // Handle paginated response
                            const allDives = (diveResponse as any).data || (Array.isArray(diveResponse) ? diveResponse : []);
                            const bookingDives = allDives.filter((dive: BookingDive) => String(dive.booking_id) === bookingId);
                            const existingDives = bookingDives.length;
                            setDiveCount(existingDives + 1); // +1 for the new dive being added
                        } catch (error) {
                            console.error('Failed to fetch booking dives:', error);
                            // Fallback: assume 0 existing dives
                            setDiveCount(1);
                        }
                    }
                } catch (error) {
                    console.error('Failed to calculate dive count:', error);
                }
            } else {
                setSelectedBooking(null);
                setDiveCount(0);
            }
        };
        calculateDiveCount();
    }, [bookingId, bookings]);

    // Watch dive_group_id to set selected group and fetch full details with members
    const diveGroupId = form.watch('dive_group_id');
    useEffect(() => {
        const fetchGroupDetails = async () => {
            if (diveGroupId) {
                try {
                    // Fetch full group details including members
                    const groupDetails = await diveGroupService.getById(diveGroupId);
                    setSelectedDiveGroup(groupDetails);
                    // Initialize diver counts for each member (default to 1)
                    if (groupDetails.members) {
                        const initialCounts: Record<number, number> = {};
                        groupDetails.members.forEach((member) => {
                            initialCounts[member.id] = memberDiverCounts[member.id] || 1;
                        });
                        setMemberDiverCounts(initialCounts);
                    }
                } catch (error) {
                    console.error('Failed to fetch dive group details:', error);
                    // Fallback to basic group info from list
                    const group = diveGroups.find(g => String(g.id) === diveGroupId);
                    setSelectedDiveGroup(group || null);
                }
            } else {
                setSelectedDiveGroup(null);
                setMemberDiverCounts({});
            }
        };
        fetchGroupDetails();
    }, [diveGroupId, diveGroups]);

    // Watch price_list_item_id to auto-populate price
    const priceListItemId = form.watch('price_list_item_id');
    useEffect(() => {
        if (priceListItemId) {
            const item = priceListItems.find(p => String(p.id) === priceListItemId);
            if (item) {
                setSelectedPriceItem(item);
                const price = item.base_price || item.price;
                form.setValue('price', String(price));
            }
        } else {
            setSelectedPriceItem(null);
        }
    }, [priceListItemId, priceListItems, form]);

    // Handle price suggestion selection
    const handlePriceSuggestionSelect = (suggestion: PriceSuggestion) => {
        form.setValue('price_list_item_id', String(suggestion.id));
        form.setValue('price', String(suggestion.price));
    };

    // Helper function to convert date string to Date object
    const parseDate = (dateString: string | undefined): Date | null => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    };

    // Helper function to convert Date object to ISO date string (YYYY-MM-DD)
    const formatDateToString = (date: Date | null): string => {
        if (!date) return "";
        return date.toISOString().split('T')[0];
    };

    const diveDate = form.watch('dive_date');
    const diveStatus = form.watch('status');
    const showDiveLog = diveStatus === 'In Progress' || diveStatus === 'Completed';

    async function onSubmit(data: BookingDiveFormValues) {
        setLoading(true);
        try {
            const payload: BookingDiveFormData = {
                dive_site_id: parseInt(data.dive_site_id),
                boat_id: data.boat_id && data.boat_id !== "none" ? parseInt(data.boat_id) : undefined,
                dive_date: data.dive_date || undefined,
                dive_time: data.dive_time || undefined,
                price_list_item_id: data.price_list_item_id ? parseInt(data.price_list_item_id) : undefined,
                price: data.price ? parseFloat(data.price) : undefined,
                dive_duration: data.dive_duration ? parseInt(data.dive_duration) : undefined,
                max_depth: data.max_depth ? parseFloat(data.max_depth) : undefined,
                status: data.status,
                dive_log_notes: data.dive_log_notes || undefined,
            };

            // Handle booking mode
            if (createMode === 'existing' && data.booking_id) {
                payload.booking_id = parseInt(data.booking_id);
            } else if (createMode === 'quick' && data.customer_id) {
                payload.customer_id = parseInt(data.customer_id);
                payload.booking_date = data.booking_date || data.dive_date || undefined;
                payload.number_of_divers = data.number_of_divers ? parseInt(data.number_of_divers) : undefined;
            } else if (createMode === 'group' && data.dive_group_id) {
                payload.dive_group_id = parseInt(data.dive_group_id);
                payload.booking_date = data.booking_date || data.dive_date || undefined;
                // Add member_diver_counts object mapping member IDs to their diver counts
                if (selectedDiveGroup && selectedDiveGroup.members) {
                    (payload as any).member_diver_counts = {};
                    selectedDiveGroup.members.forEach((member) => {
                        (payload as any).member_diver_counts[member.id] = memberDiverCounts[member.id] || 1;
                    });
                }
            }

            if (bookingDiveId) {
                await bookingDiveService.update(Number(bookingDiveId), payload);
                router.push("/dashboard/booking-dives");
                router.refresh();
            } else {
                const response = await bookingDiveService.create(payload);
                // For group bookings, the response structure is different
                if (createMode === 'group' && (response as any).bookings) {
                    // Group booking was successful, show success message
                    router.push("/dashboard/booking-dives");
                    router.refresh();
                } else {
                    router.push("/dashboard/booking-dives");
                    router.refresh();
                }
            }
        } catch (error) {
            console.error("Failed to save booking dive", error);
        } finally {
            setLoading(false);
        }
    }

    const handleCompleteDive = async () => {
        const diveId = bookingDiveId;
        if (!diveId) return;

        setLoading(true);
        try {
            const diveDuration = form.getValues('dive_duration');
            const maxDepth = form.getValues('max_depth');
            const diveLogNotes = form.getValues('dive_log_notes');

            await bookingDiveService.complete(Number(diveId), {
                dive_duration: diveDuration ? parseInt(diveDuration) : undefined,
                max_depth: maxDepth ? parseFloat(maxDepth) : undefined,
                dive_log_notes: diveLogNotes || undefined,
            });

            form.setValue('status', 'Completed');
            router.refresh();
        } catch (error) {
            console.error("Failed to complete dive", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Booking Mode Selection */}
                {!initialData && !bookingDiveId && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Booking Mode
                            </CardTitle>
                            <CardDescription>
                                Choose how to create this dive booking.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="mode-existing"
                                        name="booking-mode"
                                        checked={createMode === 'existing'}
                                        onChange={() => {
                                            setCreateMode('existing');
                                            form.setValue('customer_id', '');
                                            form.setValue('dive_group_id', '');
                                            setMemberDiverCounts({});
                                        }}
                                        className="h-4 w-4"
                                    />
                                    <label htmlFor="mode-existing" className="text-sm font-medium cursor-pointer">
                                        Select Existing Booking
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="mode-quick"
                                        name="booking-mode"
                                        checked={createMode === 'quick'}
                                        onChange={() => {
                                            setCreateMode('quick');
                                            form.setValue('booking_id', '');
                                            form.setValue('dive_group_id', '');
                                            setMemberDiverCounts({});
                                        }}
                                        className="h-4 w-4"
                                    />
                                    <label htmlFor="mode-quick" className="text-sm font-medium cursor-pointer">
                                        Quick Booking Mode (Walk-in)
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="mode-group"
                                        name="booking-mode"
                                        checked={createMode === 'group'}
                                        onChange={() => {
                                            setCreateMode('group');
                                            form.setValue('booking_id', '');
                                            form.setValue('customer_id', '');
                                            setMemberDiverCounts({});
                                        }}
                                        className="h-4 w-4"
                                    />
                                    <label htmlFor="mode-group" className="text-sm font-medium cursor-pointer">
                                        Book for Dive Group
                                    </label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Booking Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            {createMode === 'quick' ? 'Quick Booking Information' : createMode === 'group' ? 'Dive Group Booking Information' : 'Booking Information'}
                        </CardTitle>
                        <CardDescription>
                            {createMode === 'quick' 
                                ? 'Select customer for walk-in booking. A booking will be created automatically.'
                                : createMode === 'group'
                                ? 'Select a dive group. Bookings will be created for all group members.'
                                : 'Select the booking this dive belongs to.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        {createMode === 'existing' ? (
                            <FormField
                                control={form.control}
                                name="booking_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Booking</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                    <SelectTrigger className="pl-9">
                                                        <SelectValue placeholder="Select booking" />
                                                    </SelectTrigger>
                                                </div>
                                            </FormControl>
                                            <SelectContent>
                                                {bookings.map((booking) => (
                                                    <SelectItem key={booking.id} value={String(booking.id)}>
                                                        {booking.customer?.full_name || `Booking #${booking.id}`} - {safeFormatDate(booking.booking_date, "MMM d, yyyy", "No date")}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ) : createMode === 'group' ? (
                            <>
                                <FormField
                                    control={form.control}
                                    name="dive_group_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dive Group</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                        <SelectTrigger className="pl-9">
                                                            <SelectValue placeholder="Select dive group" />
                                                        </SelectTrigger>
                                                    </div>
                                                </FormControl>
                                                <SelectContent>
                                                    {diveGroups.map((group) => (
                                                        <SelectItem key={group.id} value={String(group.id)}>
                                                            {group.group_name} {group.member_count ? `(${group.member_count} members)` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {selectedDiveGroup && selectedDiveGroup.members && selectedDiveGroup.members.length > 0 && (
                                                <div className="mt-4 space-y-3">
                                                    <p className="text-sm font-medium">Group Members ({selectedDiveGroup.members.length}):</p>
                                                    <div className="space-y-3 p-3 bg-muted rounded-md">
                                                        {selectedDiveGroup.members.map((member) => (
                                                            <div key={member.id} className="flex items-center justify-between gap-4">
                                                                <label className="text-sm font-medium flex-1">
                                                                    {member.full_name}
                                                                </label>
                                                                <div className="flex items-center gap-2 w-32">
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        value={memberDiverCounts[member.id] || 1}
                                                                        onChange={(e) => {
                                                                            const value = parseInt(e.target.value) || 1;
                                                                            setMemberDiverCounts(prev => ({
                                                                                ...prev,
                                                                                [member.id]: value
                                                                            }));
                                                                        }}
                                                                        className="w-20"
                                                                    />
                                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                                        diver{memberDiverCounts[member.id] !== 1 ? 's' : ''}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Total divers: {selectedDiveGroup.members.reduce((sum, member) => sum + (memberDiverCounts[member.id] || 1), 0)}
                                                    </p>
                                                </div>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="booking_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Booking Date</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                    <DatePicker
                                                        selected={parseDate(field.value || diveDate)}
                                                        onChange={(date) => field.onChange(formatDateToString(date))}
                                                        dateFormat="PPP"
                                                        placeholderText="Pick a date"
                                                        wrapperClassName="w-full"
                                                        maxDate={new Date("2100-12-31")}
                                                        minDate={new Date("1900-01-01")}
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
                            </>
                        ) : (
                            <>
                                <FormField
                                    control={form.control}
                                    name="customer_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Customer</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                        <SelectTrigger className="pl-9">
                                                            <SelectValue placeholder="Select customer" />
                                                        </SelectTrigger>
                                                    </div>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="booking_date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Booking Date</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                        <DatePicker
                                                            selected={parseDate(field.value || diveDate)}
                                                            onChange={(date) => field.onChange(formatDateToString(date))}
                                                            dateFormat="PPP"
                                                            placeholderText="Pick a date"
                                                            wrapperClassName="w-full"
                                                            maxDate={new Date("2100-12-31")}
                                                            minDate={new Date("1900-01-01")}
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
                                        name="number_of_divers"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Number of Divers</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="1" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Dive Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Dive Details
                        </CardTitle>
                        <CardDescription>
                            Information about the dive location and schedule.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="dive_site_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dive Site</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                <SelectTrigger className="pl-9">
                                                    <SelectValue placeholder="Select dive site" />
                                                </SelectTrigger>
                                            </div>
                                        </FormControl>
                                        <SelectContent>
                                            {diveSites.map((site) => (
                                                <SelectItem key={site.id} value={String(site.id)}>
                                                    {site.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="dive_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Dive Date</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                <DatePicker
                                                    selected={parseDate(field.value)}
                                                    onChange={(date) => field.onChange(formatDateToString(date))}
                                                    dateFormat="PPP"
                                                    placeholderText="Pick a date"
                                                    wrapperClassName="w-full"
                                                    maxDate={new Date("2100-12-31")}
                                                    minDate={new Date("1900-01-01")}
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
                                name="dive_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dive Time</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input type="time" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="boat_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Boat (Optional)</FormLabel>
                                    <Select 
                                        onValueChange={(value) => field.onChange(value === "none" ? "" : value)} 
                                        value={field.value === "" || !field.value ? "none" : field.value}
                                    >
                                        <FormControl>
                                            <div className="relative">
                                                <Ship className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                <SelectTrigger className="pl-9">
                                                    <SelectValue placeholder="Select boat (optional)" />
                                                </SelectTrigger>
                                            </div>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {boats.map((boat) => (
                                                <SelectItem key={boat.id} value={String(boat.id)}>
                                                    {boat.name} {boat.capacity ? `(${boat.capacity} capacity)` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Price Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            Pricing
                        </CardTitle>
                        <CardDescription>
                            Select price list item and set the dive price.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        {/* Price Suggestions */}
                        {diveCount > 0 && selectedBooking && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Smart Price Suggestions</label>
                                <PriceSuggestionDropdown
                                    diveCount={diveCount}
                                    serviceType="Dive Trip"
                                    customerId={selectedBooking.customer_id}
                                    selectedPriceItemId={priceListItemId ? parseInt(priceListItemId) : undefined}
                                    onSelect={handlePriceSuggestionSelect}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Based on {diveCount} dive{diveCount !== 1 ? 's' : ''} for this booking
                                </p>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="price_list_item_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price List Item {diveCount > 0 && "(or select manually)"}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select price list item (optional)" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {priceListItems.map((item) => {
                                                const price = Number(item.base_price || item.price || 0);
                                                return (
                                                    <SelectItem key={item.id} value={String(item.id)}>
                                                        {item.name} - ${price.toFixed(2)}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        {selectedPriceItem && `Selected: ${selectedPriceItem.name} - ${selectedPriceItem.description || 'No description'}`}
                                    </FormDescription>
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
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input type="number" step="0.01" min="0" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        Price will be auto-filled when price list item is selected. You can override it manually.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Dive Status */}
                {initialData && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Dive Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
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
                        </CardContent>
                    </Card>
                )}

                {/* Dive Log Section */}
                {showDiveLog && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Dive Log
                            </CardTitle>
                            <CardDescription>
                                Record actual dive details after completion.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            {initialData && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Dive Site</label>
                                        <p className="text-sm">{initialData.dive_site?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Date</label>
                                        <p className="text-sm">{safeFormatDate(initialData.dive_date, "MMM d, yyyy", "N/A")}</p>
                                    </div>
                                    {initialData.instructors && initialData.instructors.length > 0 && (
                                        <div className="md:col-span-2">
                                            <label className="text-sm font-medium text-muted-foreground">Instructors</label>
                                            <p className="text-sm">
                                                {initialData.instructors.map(i => i.user.full_name).join(', ')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="dive_duration"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dive Duration (minutes)</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="1" max="600" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="max_depth"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Max Depth (meters/feet)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" min="0" max="200" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="dive_log_notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dive Log Notes</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Enter any additional notes about the dive..."
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {initialData && diveStatus !== 'Completed' && (
                                <Button
                                    type="button"
                                    onClick={handleCompleteDive}
                                    disabled={loading}
                                    className="w-full"
                                >
                                    Complete Dive
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" size="lg" disabled={loading}>
                        {loading ? "Saving..." : (bookingDiveId ? "Update Booking Dive" : "Create Booking Dive")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
