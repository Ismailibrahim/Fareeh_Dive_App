"use client";

import { useForm, useFieldArray } from "react-hook-form";
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
import { priceListService, PriceList } from "@/lib/api/services/price-list.service";
import { priceListItemService } from "@/lib/api/services/price-list-item.service";
import { PriceListItem } from "@/lib/api/services/price-list.service";
import { invoiceService } from "@/lib/api/services/invoice.service";
import { toast } from "sonner";
import { diveGroupService, DiveGroup } from "@/lib/api/services/dive-group.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Ship, Clock, CalendarIcon, DollarSign, User, FileText, ChevronRight, Check, Loader2, Plus, Trash2, Sparkles, Backpack, Info, CheckCircle2, ShoppingCart } from "lucide-react";
import { SafeDatePicker as DatePicker } from "@/components/ui/safe-date-picker";
import { cn } from "@/lib/utils";
import { safeFormatDate } from "@/lib/utils/date-format";
import { PriceSuggestionDropdown } from "@/components/price-list/PriceSuggestionDropdown";
import { PriceSuggestion } from "@/lib/api/services/price-list.service";
import { SearchableSelect } from "@/components/ui/searchable-select";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EquipmentPreparationCard } from "./EquipmentPreparationCard";

const bookingDiveSchema = z.object({
    booking_id: z.string().optional(),
    customer_id: z.string().optional(),
    customer_ids: z.array(z.string()).optional(),
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
    additional_items: z.array(z.object({
        price_list_item_id: z.string(),
        price: z.string(),
        dive_site_id: z.string().optional(),
    })).optional(),
    extra_dive_site_ids: z.array(z.object({
        id: z.string()
    })).optional(),
}).refine((data) => {
    // Either booking_id, customer_id, customer_ids, or dive_group_id must be provided
    return data.booking_id || data.customer_id || data.dive_group_id || (data.customer_ids && data.customer_ids.length > 0);
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
    const [priceLists, setPriceLists] = useState<PriceList[]>([]);
    const [priceListItems, setPriceListItems] = useState<PriceListItem[]>([]);
    const [selectedPriceListId, setSelectedPriceListId] = useState<string>("");
    const [selectedPriceItem, setSelectedPriceItem] = useState<PriceListItem | null>(null);
    const [diveCount, setDiveCount] = useState<number>(0);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [selectedDiveGroup, setSelectedDiveGroup] = useState<DiveGroup | null>(null);
    const [memberDiverCounts, setMemberDiverCounts] = useState<Record<number, number>>({});
    const [isSuccess, setIsSuccess] = useState(false);
    const [successBookingId, setSuccessBookingId] = useState<number | null>(null);
    const [generatingInvoice, setGeneratingInvoice] = useState(false);
    const [customerEquipment, setCustomerEquipment] = useState<Record<number, any>>({});
    const [fetchingEquipment, setFetchingEquipment] = useState(false);

    // Staging area for pricing (Red Box)
    const [redBoxPriceListId, setRedBoxPriceListId] = useState<string>("");
    const [redBoxPriceListItemId, setRedBoxPriceListItemId] = useState<string>("");
    const [redBoxPrice, setRedBoxPrice] = useState<string>("0");

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

                // Fetch price lists
                const priceListData = await priceListService.getAll(1, 100);
                const listData = Array.isArray(priceListData) ? priceListData : (priceListData as any).data || [];
                setPriceLists(listData);

                // Fetch price list items (all active ones)
                const priceData = await priceListItemService.getAll({ is_active: true });
                const priceList = Array.isArray(priceData) ? priceData : (priceData as any).data || [];
                console.log('Fetched Price List Items:', priceList);
                setPriceListItems(priceList);
                
                console.log('Fetched Customers:', customerList);
                console.log('Fetched Bookings:', bookingList);
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
            customer_ids: [],
            dive_group_id: "",
            booking_date: "",
            number_of_divers: "",
            dive_site_id: initialData?.dive_site_id ? String(initialData.dive_site_id) : "",
            boat_id: initialData?.boat_id ? String(initialData.boat_id) : "none",
            dive_date: initialData?.dive_date ? initialData.dive_date.split('T')[0] : "",
            dive_time: initialData?.dive_time ? initialData.dive_time.substring(0, 5) : "",
            price_list_item_id: "", // No longer used for direct entry
            price: "", // No longer used for direct entry
            dive_duration: initialData?.dive_duration ? String(initialData.dive_duration) : "",
            max_depth: initialData?.max_depth ? String(initialData.max_depth) : "",
            status: initialData?.status || 'Scheduled',
            dive_log_notes: initialData?.dive_log_notes || "",
            additional_items: initialData?.additionalItems 
                ? initialData.additionalItems
                    .filter(item => Number(item.price) > 0)
                    .map(item => ({
                        id: String(item.id),
                        price_list_item_id: String(item.price_list_item_id),
                        price: String(item.price),
                        dive_site_id: item.dive_site_id ? String(item.dive_site_id) : "",
                    })) 
                : [],
            extra_dive_site_ids: initialData?.additionalItems 
                ? initialData.additionalItems
                    .filter(item => Number(item.price) === 0)
                    .map(item => ({
                        id: String(item.dive_site_id)
                    }))
                : [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "additional_items",
    });

    const { fields: extraSiteFields, append: appendExtraSite, remove: removeExtraSite } = useFieldArray({
        control: form.control,
        name: "extra_dive_site_ids",
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

    // Watch customer_id and customer_ids to fetch equipment requirements
    const watchedCustomerId = form.watch('customer_id');
    const watchedCustomerIds = form.watch('customer_ids');

    useEffect(() => {
        const fetchEquipmentForCustomers = async () => {
            const idsToFetch: string[] = [];
            
            if (createMode === 'quick') {
                if (watchedCustomerIds && watchedCustomerIds.length > 0) {
                    idsToFetch.push(...watchedCustomerIds);
                } else if (watchedCustomerId) {
                    idsToFetch.push(watchedCustomerId);
                }
            } else if (createMode === 'existing') {
                if (watchedCustomerId) {
                    idsToFetch.push(watchedCustomerId);
                } else if (selectedBooking?.customer_id) {
                    idsToFetch.push(String(selectedBooking.customer_id));
                } else if (initialData?.booking?.customer_id) {
                    idsToFetch.push(String(initialData.booking.customer_id));
                }
            } else if (createMode === 'group' && selectedDiveGroup?.members) {
                idsToFetch.push(...selectedDiveGroup.members.map(m => String(m.id)));
            }

            if (idsToFetch.length === 0) {
                setCustomerEquipment({});
                return;
            }

            setFetchingEquipment(true);
            try {
                const equipmentData: Record<number, any> = {};
                await Promise.all(idsToFetch.map(async (id) => {
                    try {
                        const response = await customerService.getEquipmentRequest(id);
                        if (response?.data) {
                            equipmentData[Number(id)] = response.data;
                        }
                    } catch (err) {
                        console.error(`Failed to fetch equipment for customer ${id}:`, err);
                    }
                }));
                setCustomerEquipment(equipmentData);
            } finally {
                setFetchingEquipment(false);
            }
        };

        fetchEquipmentForCustomers();
    }, [watchedCustomerId, watchedCustomerIds, createMode, selectedDiveGroup, selectedBooking, initialData]);

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

    // Watch redBoxPriceListItemId to auto-populate redBoxPrice
    useEffect(() => {
        if (redBoxPriceListItemId) {
            const item = priceListItems.find(p => String(p.id) === redBoxPriceListItemId);
            if (item) {
                const price = item.base_price || item.price;
                setRedBoxPrice(String(price));
            }
        }
    }, [redBoxPriceListItemId, priceListItems]);

    // Handle price suggestion selection
    const handlePriceSuggestionSelect = (suggestion: PriceSuggestion) => {
        setRedBoxPriceListItemId(String(suggestion.id));
        setRedBoxPrice(String(suggestion.price));
    };

    const handleAddCurrentToList = () => {
        if (redBoxPriceListItemId) {
            // Get the current main site to set as default for this row
            const currentMainSite = form.getValues('dive_site_id');
            
            append({
                price_list_item_id: redBoxPriceListItemId,
                price: redBoxPrice || "0",
                dive_site_id: currentMainSite || "", // Capture the site at the time of adding
            });
            // Clear the staging fields
            setRedBoxPriceListItemId("");
            setRedBoxPrice("0");
            toast.success("Item added to itinerary");
        } else {
            toast.error("Please select a service first");
        }
    };
    
    // Initialize selectedPriceListId from initialData (now redBoxPriceListId)
    useEffect(() => {
        if (initialData?.price_list_item_id && priceListItems.length > 0) {
            const item = priceListItems.find(p => p.id === initialData.price_list_item_id);
            if (item) {
                setRedBoxPriceListId(String(item.price_list_id));
            }
        }
    }, [initialData, priceListItems]);

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
                price_list_item_id: undefined, // Let backend promote from additional_items
                price: undefined, // Let backend promote from additional_items
                dive_duration: data.dive_duration ? parseInt(data.dive_duration) : undefined,
                max_depth: data.max_depth ? parseFloat(data.max_depth) : undefined,
                status: data.status,
                dive_log_notes: data.dive_log_notes || undefined,
                additional_items: data.additional_items?.map(item => ({
                    id: item.id ? parseInt(item.id) : undefined,
                    price_list_item_id: parseInt(item.price_list_item_id),
                    price: parseFloat(item.price),
                    dive_site_id: item.dive_site_id ? parseInt(item.dive_site_id) : undefined,
                })),
                extra_dive_site_ids: data.extra_dive_site_ids
                    ?.filter(site => site.id !== "")
                    ?.map(site => parseInt(site.id)),
            };

            // Handle booking mode
            if (createMode === 'existing' && data.booking_id) {
                payload.booking_id = parseInt(data.booking_id);
            } else if (createMode === 'quick') {
                if (data.customer_ids && data.customer_ids.length > 0) {
                    (payload as any).customer_ids = data.customer_ids.map(id => parseInt(id));
                } else if (data.customer_id) {
                    payload.customer_id = parseInt(data.customer_id);
                }
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
                toast.success("Booking dive updated successfully");
                router.push("/dashboard/booking-dives");
                router.refresh();
            } else {
                const response = await bookingDiveService.create(payload);
                toast.success("Booking dive created successfully");
                
                // Set success state
                setIsSuccess(true);
                
                // Get booking ID from response
                const bId = (response as any).booking_id || (response as any).id;
                setSuccessBookingId(bId);
                
                router.refresh();
            }
        } catch (error: any) {
            console.error("Failed to save booking dive", error);
            toast.error(error?.response?.data?.message || "Failed to save booking dive");
        } finally {
            setLoading(false);
        }
    }

    const handleGenerateInvoice = async () => {
        if (!successBookingId) return;
        
        setGeneratingInvoice(true);
        try {
            const invoice = await invoiceService.generateFromBooking({
                booking_id: successBookingId,
                invoice_type: 'Full',
                include_dives: true,
                include_equipment: true,
                include_excursions: true
            });
            
            toast.success("Invoice generated successfully");
            router.push(`/dashboard/invoices/${invoice.id}`);
        } catch (error: any) {
            console.error("Failed to generate invoice", error);
            toast.error(error?.response?.data?.message || "Failed to generate invoice");
        } finally {
            setGeneratingInvoice(false);
        }
    };

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

    const renderEquipmentRequirements = () => {
        const customerIds: string[] = [];
        if (createMode === 'quick') {
            customerIds.push(...(watchedCustomerIds && watchedCustomerIds.length > 0 ? watchedCustomerIds : (watchedCustomerId ? [watchedCustomerId] : [])));
        } else if (createMode === 'existing') {
            if (watchedCustomerId) {
                customerIds.push(watchedCustomerId);
            } else if (selectedBooking?.customer_id) {
                customerIds.push(String(selectedBooking.customer_id));
            } else if (initialData?.booking?.customer_id) {
                customerIds.push(String(initialData.booking.customer_id));
            }
        } else if (createMode === 'group') {
            customerIds.push(...(selectedDiveGroup?.members?.map(m => String(m.id)) || []));
        }

        const validIds = Array.from(new Set(customerIds.filter(id => id && id !== "")));
        if (validIds.length === 0) return null;

        const customerNamesMap: Record<number, string> = {};
        customers.forEach(c => {
            customerNamesMap[c.id] = c.full_name;
        });

        return (
            <div className="mt-8">
                <EquipmentPreparationCard 
                    customerIds={validIds} 
                    customerNames={customerNamesMap}
                />
            </div>
        );
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <Card className="w-full max-w-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <Check className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl">Booking Created Successfully!</CardTitle>
                        <CardDescription>
                            The dive booking has been saved. What would you like to do next?
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button 
                            className="w-full h-12 text-base" 
                            onClick={handleGenerateInvoice}
                            disabled={generatingInvoice}
                        >
                            {generatingInvoice ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating Invoice...
                                </>
                            ) : (
                                <>
                                    <FileText className="mr-2 h-5 w-5" />
                                    Generate Invoice Now
                                </>
                            )}
                        </Button>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" onClick={() => router.push("/dashboard/booking-dives")}>
                                View All Bookings
                            </Button>
                            <Button variant="outline" onClick={() => setIsSuccess(false)}>
                                Add Another Dive
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                                        <FormControl>
                                            <SearchableSelect
                                                options={bookings.map((booking) => ({
                                                    value: String(booking.id),
                                                    label: `${booking.customer?.full_name || `Booking #${booking.id}`} - ${safeFormatDate(booking.booking_date, "MMM d, yyyy", "No date")}`,
                                                    searchTerms: `${booking.customer?.full_name} ${booking.id} ${booking.booking_date}`
                                                }))}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                placeholder="Select booking"
                                                searchPlaceholder="Search by customer name or date..."
                                            />
                                        </FormControl>
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
                                            <FormControl>
                                                <SearchableSelect
                                                    options={diveGroups.map((group) => ({
                                                        value: String(group.id),
                                                        label: `${group.group_name} ${group.member_count ? `(${group.member_count} members)` : ''}`,
                                                        searchTerms: group.group_name
                                                    }))}
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    placeholder="Select dive group"
                                                    searchPlaceholder="Search group name..."
                                                />
                                            </FormControl>
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
                                <div className="space-y-3">
                                    <FormLabel className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-primary" />
                                        Select Divers (Walk-in Group)
                                    </FormLabel>
                                    
                                    {/* List of selected divers */}
                                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-muted/30 rounded-md border border-dashed">
                                        {(form.watch('customer_ids') || []).length === 0 && (
                                            <span className="text-xs text-muted-foreground italic p-1">No divers selected. Add at least one diver below.</span>
                                        )}
                                        {form.watch('customer_ids')?.map(id => {
                                            const customer = customers.find(c => String(c.id) === id);
                                            return (
                                                <Badge key={id} variant="secondary" className="pl-3 pr-1 py-1 h-8 bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary flex items-center gap-1">
                                                    {customer?.full_name}
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-5 w-5 ml-1 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                                        onClick={() => {
                                                            const current = form.getValues('customer_ids') || [];
                                                            form.setValue('customer_ids', current.filter(cid => cid !== id));
                                                        }}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </Badge>
                                            );
                                        })}
                                    </div>

                                    <SearchableSelect
                                        options={customers.map((customer) => ({
                                            value: String(customer.id),
                                            label: customer.full_name,
                                            searchTerms: `${customer.full_name} ${customer.email || ""} ${customer.passport_number || ""}`
                                        }))}
                                        onValueChange={(value) => {
                                            const current = form.getValues('customer_ids') || [];
                                            if (!current.includes(value)) {
                                                form.setValue('customer_ids', [...current, value]);
                                                // Also set single customer_id for backward compatibility/validation if needed
                                                if (current.length === 0) form.setValue('customer_id', value);
                                            }
                                        }}
                                        placeholder="Add diver to trip..."
                                        searchPlaceholder="Search by name, email or passport..."
                                    />
                                    <FormMessage />
                                </div>
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

                {/* Equipment Requirements Display */}
                {renderEquipmentRequirements()}

                {/* Dive Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Trip Itinerary & Pricing
                        </CardTitle>
                        <CardDescription>
                            Define the sites visited and the services/pricing for this trip.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="dive_site_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dive Site</FormLabel>
                                    <FormControl>
                                        <SearchableSelect
                                            options={diveSites.map((site) => ({
                                                value: String(site.id),
                                                label: site.name,
                                                searchTerms: site.name
                                            }))}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            placeholder="Select dive site"
                                            searchPlaceholder="Search dive site..."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Extra Dive Sites */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <FormLabel className="text-sm font-medium">Extra Dive Sites visited in this trip</FormLabel>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 gap-1"
                                    onClick={() => appendExtraSite({ id: "" })}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Another Site
                                </Button>
                            </div>
                            
                            {extraSiteFields.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">No extra sites added. This is a single-tank trip.</p>
                            ) : (
                                <div className="space-y-3">
                                    {extraSiteFields.map((field, index) => (
                                        <div key={field.id} className="flex gap-2 items-center">
                                            <div className="flex-1">
                                                <FormField
                                                    control={form.control}
                                                    name={`extra_dive_site_ids.${index}.id`}
                                                    render={({ field: extraSiteField }) => (
                                                        <FormItem className="space-y-0">
                                                            <FormControl>
                                                                <SearchableSelect
                                                                    options={diveSites.map((site) => ({
                                                                        value: String(site.id),
                                                                        label: site.name,
                                                                        searchTerms: site.name
                                                                    }))}
                                                                    value={extraSiteField.value}
                                                                    onValueChange={extraSiteField.onChange}
                                                                    placeholder="Select extra dive site"
                                                                    className="h-9"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-destructive hover:bg-destructive/10"
                                                onClick={() => removeExtraSite(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

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

                        {/* Pricing & Itinerary Section */}
                        <div className="space-y-6 pt-6 border-t mt-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Dives & Services</h3>
                                
                                {/* Price Suggestions */}
                                {diveCount > 0 && selectedBooking && (
                                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                                        <label className="text-sm font-medium flex items-center gap-2 mb-2">
                                            <Sparkles className="h-4 w-4 text-primary" />
                                            Smart Price Suggestions
                                        </label>
                                        <PriceSuggestionDropdown
                                            diveCount={diveCount}
                                            serviceType="Dive Trip"
                                            customerId={selectedBooking.customer_id}
                                            selectedPriceItemId={redBoxPriceListItemId ? parseInt(redBoxPriceListItemId) : undefined}
                                            onSelect={handlePriceSuggestionSelect}
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            Based on {diveCount} dive{diveCount !== 1 ? 's' : ''} for this booking
                                        </p>
                                    </div>
                                )}

                                {/* Picker Area */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-muted/30 p-4 rounded-lg border border-dashed">
                                    <div className="md:col-span-1">
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs">Price List</FormLabel>
                                            <FormControl>
                                                <SearchableSelect
                                                    options={priceLists.map((list) => ({
                                                        value: String(list.id),
                                                        label: list.name,
                                                        searchTerms: list.name
                                                    }))}
                                                    value={redBoxPriceListId}
                                                    onValueChange={(val) => {
                                                        setRedBoxPriceListId(val);
                                                        setRedBoxPriceListItemId("");
                                                        setRedBoxPrice("0");
                                                    }}
                                                    placeholder="Select list"
                                                    className="h-10"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    </div>

                                    <div className="md:col-span-1">
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs">Service Type</FormLabel>
                                            <FormControl>
                                                <SearchableSelect
                                                    options={priceListItems
                                                        .filter(item => !redBoxPriceListId || String(item.price_list_id) === redBoxPriceListId)
                                                        .map((item) => {
                                                            const price = Number(item.base_price || item.price || 0);
                                                            const listName = priceLists.find(l => l.id === item.price_list_id)?.name;
                                                            return {
                                                                value: String(item.id),
                                                                label: `${item.name} - $${price.toFixed(2)}`,
                                                                searchTerms: `${item.name} ${listName || ""}`
                                                            };
                                                        })}
                                                    value={redBoxPriceListItemId}
                                                    onValueChange={setRedBoxPriceListItemId}
                                                    placeholder="Select service"
                                                    className="h-10"
                                                    disabled={!redBoxPriceListId && priceLists.length > 1}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    </div>

                                    <div className="md:col-span-1">
                                        <FormItem className="space-y-1">
                                            <FormLabel className="text-xs">Price</FormLabel>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        type="number" 
                                                        step="0.01" 
                                                        className="pl-9 h-10" 
                                                        value={redBoxPrice}
                                                        onChange={(e) => setRedBoxPrice(e.target.value)}
                                                    />
                                                </div>
                                                <Button 
                                                    type="button" 
                                                    variant="default" 
                                                    size="icon"
                                                    className="h-10 w-10 shrink-0"
                                                    onClick={handleAddCurrentToList}
                                                    disabled={!redBoxPriceListItemId}
                                                >
                                                    <Plus className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </FormItem>
                                    </div>
                                </div>
                            </div>

                            {/* Itinerary List */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Itinerary</h4>
                                {fields.length === 0 ? (
                                    <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed">
                                        <p className="text-sm text-muted-foreground italic">Add your first dive above.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {fields.map((field, index) => (
                                            <div key={field.id} className="flex gap-3 items-end bg-card p-3 rounded-lg border shadow-sm transition-all hover:border-primary/30">
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                                                    <div className="md:col-span-5">
                                                        <FormField
                                                            control={form.control}
                                                            name={`additional_items.${index}.price_list_item_id`}
                                                            render={({ field: itemField }) => (
                                                                <FormItem className="space-y-1">
                                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Service</FormLabel>
                                                                    <FormControl>
                                                                        <SearchableSelect
                                                                            options={priceListItems.map((item) => ({
                                                                                value: String(item.id),
                                                                                label: item.name,
                                                                                searchTerms: item.name
                                                                            }))}
                                                                            value={itemField.value}
                                                                            onValueChange={(val) => {
                                                                                itemField.onChange(val);
                                                                                const selected = priceListItems.find(p => String(p.id) === val);
                                                                                if (selected) {
                                                                                    form.setValue(`additional_items.${index}.price`, String(selected.base_price || selected.price || 0));
                                                                                }
                                                                            }}
                                                                            placeholder="Select service"
                                                                            className="h-9"
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="md:col-span-4">
                                                        <FormField
                                                            control={form.control}
                                                            name={`additional_items.${index}.dive_site_id`}
                                                            render={({ field: siteField }) => (
                                                                <FormItem className="space-y-1">
                                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Location</FormLabel>
                                                                    <FormControl>
                                                                        <SearchableSelect
                                                                            options={diveSites.map((site) => ({
                                                                                value: String(site.id),
                                                                                label: site.name,
                                                                                searchTerms: site.name
                                                                            }))}
                                                                            value={siteField.value}
                                                                            onValueChange={siteField.onChange}
                                                                            placeholder="Same as Main"
                                                                            className="h-9"
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="md:col-span-3">
                                                        <FormField
                                                            control={form.control}
                                                            name={`additional_items.${index}.price`}
                                                            render={({ field: priceField }) => (
                                                                <FormItem className="space-y-1">
                                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Price</FormLabel>
                                                                    <div className="relative">
                                                                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                                        <Input type="number" step="0.01" className="pl-8 h-9" {...priceField} />
                                                                    </div>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-destructive hover:bg-destructive/10"
                                                    onClick={() => remove(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
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
