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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { bookingEquipmentService, BookingEquipmentFormData, BookingEquipment, AvailabilityCheckResponse } from "@/lib/api/services/booking-equipment.service";
import { bookingService, Booking } from "@/lib/api/services/booking.service";
import { equipmentBasketService, EquipmentBasket } from "@/lib/api/services/equipment-basket.service";
import { equipmentItemService, EquipmentItem } from "@/lib/api/services/equipment-item.service";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Package, DollarSign, ShoppingBasket, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { SafeDatePicker as DatePicker } from "@/components/ui/safe-date-picker";
import "react-datepicker/dist/react-datepicker.css";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { safeFormatDate, safeParseDate } from "@/lib/utils/date-format";

const bookingEquipmentSchema = z.object({
    booking_id: z.string().optional(),
    basket_id: z.string().optional(),
    equipment_source: z.enum(['Center', 'Customer Own']),
    equipment_item_id: z.string().optional(),
    checkout_date: z.string().optional(),
    return_date: z.string().optional(),
    price: z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
        message: "Price must be a valid number greater than or equal to 0",
    }),
    customer_equipment_type: z.string().optional(),
    customer_equipment_brand: z.string().optional(),
    customer_equipment_model: z.string().optional(),
    customer_equipment_serial: z.string().optional(),
    customer_equipment_notes: z.string().optional(),
}).refine((data) => {
    // Either booking_id or basket_id must be provided (and not empty string)
    return (data.booking_id && data.booking_id.trim() !== '') || (data.basket_id && data.basket_id.trim() !== '');
}, {
    message: "Either booking or basket must be provided",
    path: ["basket_id"], // Change to basket_id since that's more likely to be the issue
}).refine((data) => {
    // If Center, equipment_item_id required
    if (data.equipment_source === 'Center') {
        return !!(data.equipment_item_id && data.equipment_item_id.trim() !== '');
    }
    // If Customer Own, at least type or brand should be provided (both optional)
    return true;
}, {
    message: "Equipment item is required for Center equipment",
    path: ["equipment_item_id"],
});

interface BookingEquipmentFormProps {
    initialData?: BookingEquipment;
    bookingEquipmentId?: string | number;
    basketId?: number;
    bookingId?: number;
}

export function BookingEquipmentForm({ 
    initialData, 
    bookingEquipmentId,
    basketId: propBasketId,
    bookingId: propBookingId,
}: BookingEquipmentFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const basketIdFromQuery = searchParams?.get('basket_id');
    const bookingIdFromQuery = searchParams?.get('booking_id');
    
    const [loading, setLoading] = useState(false);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [baskets, setBaskets] = useState<EquipmentBasket[]>([]);
    const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
    const [availabilityCheck, setAvailabilityCheck] = useState<AvailabilityCheckResponse | null>(null);
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    // Determine which basket/booking to use (priority: prop > query > form selection)
    const defaultBasketId = propBasketId || (basketIdFromQuery ? parseInt(basketIdFromQuery) : undefined);
    const defaultBookingId = propBookingId || (bookingIdFromQuery ? parseInt(bookingIdFromQuery) : undefined);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch bookings
                const bookingData = await bookingService.getAll();
                const bookingList = Array.isArray(bookingData) ? bookingData : (bookingData as any).data || [];
                setBookings(bookingList);

                // Fetch baskets
                const basketData = await equipmentBasketService.getAll();
                const basketList = Array.isArray(basketData) ? basketData : (basketData as any).data || [];
                setBaskets(basketList);

                // Fetch equipment items (only available ones for Center equipment)
                const equipmentItemData = await equipmentItemService.getAll({ page: 1, status: 'Available' });
                const equipmentItemList = Array.isArray(equipmentItemData) ? equipmentItemData : (equipmentItemData as any).data || [];
                setEquipmentItems(equipmentItemList);
            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        fetchData();
    }, []);

    const form = useForm<z.infer<typeof bookingEquipmentSchema>>({
        resolver: zodResolver(bookingEquipmentSchema),
        defaultValues: {
            booking_id: initialData?.booking_id ? String(initialData.booking_id) : (defaultBookingId ? String(defaultBookingId) : ""),
            basket_id: initialData?.basket_id ? String(initialData.basket_id) : (defaultBasketId ? String(defaultBasketId) : ""),
            equipment_source: initialData?.equipment_source || 'Center',
            equipment_item_id: initialData?.equipment_item_id ? String(initialData.equipment_item_id) : "",
            checkout_date: initialData?.checkout_date ? initialData.checkout_date.split('T')[0] : "",
            return_date: initialData?.return_date ? initialData.return_date.split('T')[0] : "",
            price: initialData?.price ? String(initialData.price) : "0",
            customer_equipment_type: initialData?.customer_equipment_type || "",
            customer_equipment_brand: initialData?.customer_equipment_brand || "",
            customer_equipment_model: initialData?.customer_equipment_model || "",
            customer_equipment_serial: initialData?.customer_equipment_serial || "",
            customer_equipment_notes: initialData?.customer_equipment_notes || "",
        },
    });

    // Ensure basket_id or booking_id is set when provided via props/query
    useEffect(() => {
        if (defaultBasketId) {
            const currentValue = form.getValues('basket_id');
            if (!currentValue || currentValue === '') {
                console.log('Setting basket_id from defaultBasketId:', defaultBasketId);
                form.setValue('basket_id', String(defaultBasketId), { shouldValidate: true });
            }
        }
        if (defaultBookingId) {
            const currentValue = form.getValues('booking_id');
            if (!currentValue || currentValue === '') {
                console.log('Setting booking_id from defaultBookingId:', defaultBookingId);
                form.setValue('booking_id', String(defaultBookingId), { shouldValidate: true });
            }
        }
    }, [defaultBasketId, defaultBookingId, form]);

    const equipmentSource = form.watch('equipment_source');
    const equipmentItemId = form.watch('equipment_item_id');
    const checkoutDate = form.watch('checkout_date');
    const returnDate = form.watch('return_date');
    const equipmentType = form.watch('customer_equipment_type');

    // Debug: Log equipment source to help troubleshoot
    useEffect(() => {
        console.log('Equipment Source:', equipmentSource);
    }, [equipmentSource]);

    const handleCheckAvailability = async () => {
        if (!equipmentItemId || !checkoutDate || !returnDate) {
            alert('Please select equipment item, checkout date, and return date to check availability');
            return;
        }

        setCheckingAvailability(true);
        try {
            const result = await bookingEquipmentService.checkAvailability({
                equipment_item_id: parseInt(equipmentItemId),
                checkout_date: checkoutDate,
                return_date: returnDate,
            });
            setAvailabilityCheck(result);
        } catch (error) {
            console.error("Failed to check availability", error);
            alert('Failed to check availability');
        } finally {
            setCheckingAvailability(false);
        }
    };

    async function onSubmit(data: z.infer<typeof bookingEquipmentSchema>) {
        console.log('onSubmit called with data:', data);
        console.log('defaultBasketId:', defaultBasketId);
        console.log('defaultBookingId:', defaultBookingId);
        
        setLoading(true);
        try {
            // Ensure basket_id or booking_id is set
            const basketId = data.basket_id ? parseInt(data.basket_id) : (defaultBasketId || undefined);
            const bookingId = data.booking_id ? parseInt(data.booking_id) : (defaultBookingId || undefined);

            console.log('Resolved basketId:', basketId);
            console.log('Resolved bookingId:', bookingId);

            if (!basketId && !bookingId) {
                alert('Please select either a booking or basket');
                setLoading(false);
                return;
            }

            const payload: BookingEquipmentFormData = {
                booking_id: bookingId,
                basket_id: basketId,
                equipment_source: data.equipment_source,
                equipment_item_id: data.equipment_item_id ? parseInt(data.equipment_item_id) : undefined,
                checkout_date: data.checkout_date || undefined,
                return_date: data.return_date || undefined,
                price: data.price ? parseFloat(data.price) : undefined,
                customer_equipment_type: data.customer_equipment_type || undefined,
                customer_equipment_brand: data.customer_equipment_brand || undefined,
                customer_equipment_model: data.customer_equipment_model || undefined,
                customer_equipment_serial: data.customer_equipment_serial || undefined,
                customer_equipment_notes: data.customer_equipment_notes || undefined,
            };

            console.log('Payload being sent to API:', payload);

            if (bookingEquipmentId) {
                await bookingEquipmentService.update(Number(bookingEquipmentId), payload);
            } else {
                await bookingEquipmentService.create(payload);
            }
            
            // Navigate back to basket if basket_id was provided, otherwise to booking equipment list
            if (payload.basket_id) {
                router.push(`/dashboard/baskets/${payload.basket_id}`);
            } else if (payload.booking_id) {
                router.push(`/dashboard/bookings/${payload.booking_id}`);
            } else {
                router.push("/dashboard/booking-equipment");
            }
            router.refresh();
        } catch (error: any) {
            console.error("Failed to save booking equipment", error);
            console.error("Error response:", error?.response?.data);
            
            // Check if this is an availability error with conflicts
            if (error?.response?.status === 422 && error?.response?.data?.conflicting_assignments) {
                const conflicts = error.response.data.conflicting_assignments;
                let conflictMessage = error.response.data.message || "Equipment is not available for the requested dates.\n\n";
                conflictMessage += `Requested dates: ${error.response.data.checkout_date} to ${error.response.data.return_date}\n\n`;
                conflictMessage += "Conflicting assignments:\n";
                conflicts.forEach((conflict: any, index: number) => {
                    conflictMessage += `\n${index + 1}. Customer: ${conflict.customer_name}`;
                    if (conflict.basket_no) {
                        conflictMessage += ` (Basket: ${conflict.basket_no})`;
                    }
                    conflictMessage += `\n   Dates: ${conflict.checkout_date} to ${conflict.return_date}`;
                    conflictMessage += `\n   Status: ${conflict.assignment_status}`;
                });
                alert(conflictMessage);
            } else {
                const errorMessage = error?.response?.data?.message || 
                                   error?.response?.data?.error ||
                                   (error?.response?.data?.errors ? JSON.stringify(error.response.data.errors) : null) ||
                                   error?.message || 
                                   "Failed to save booking equipment. Please check all required fields.";
                alert(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    }

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submit event triggered');
        
        // Get current form values
        let formValues = form.getValues();
        console.log('Form values before submit:', formValues);
        
        // Ensure basket_id is set if defaultBasketId is provided
        if (defaultBasketId && (!formValues.basket_id || formValues.basket_id === '')) {
            console.log('Setting basket_id from defaultBasketId in submit handler:', defaultBasketId);
            form.setValue('basket_id', String(defaultBasketId), { shouldValidate: false });
            formValues = { ...formValues, basket_id: String(defaultBasketId) };
        }
        if (defaultBookingId && (!formValues.booking_id || formValues.booking_id === '')) {
            console.log('Setting booking_id from defaultBookingId in submit handler:', defaultBookingId);
            form.setValue('booking_id', String(defaultBookingId), { shouldValidate: false });
            formValues = { ...formValues, booking_id: String(defaultBookingId) };
        }
        
        // Manual validation checks
        const errors: string[] = [];
        
        // Check if basket_id or booking_id is provided
        if (!formValues.basket_id && !formValues.booking_id) {
            errors.push('Either booking or basket must be provided');
        }
        
        // Check equipment source requirements
        if (formValues.equipment_source === 'Center') {
            if (!formValues.equipment_item_id || formValues.equipment_item_id.trim() === '') {
                errors.push('Equipment item is required for Center equipment');
            }
        }
        // Customer Own equipment: brand is optional, no validation needed
        
        // If manual validation passes, use form validation
        if (errors.length === 0) {
            // Wait a bit for setValue to take effect
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Trigger validation
            const isValid = await form.trigger();
            const formErrors = form.formState.errors;
            console.log('Validation result:', isValid);
            console.log('Form errors:', formErrors);
            
            if (isValid) {
                form.handleSubmit(onSubmit)(e);
            } else {
                console.error('Form validation failed:', formErrors);
                // Show alert with error details
                const errorMessages = Object.entries(formErrors)
                    .filter(([_, error]) => error)
                    .map(([key, error]) => {
                        return `${key}: ${error?.message || 'Invalid value'}`;
                    }).join('\n');
                
                if (errorMessages) {
                    alert(`Please fix the following errors:\n\n${errorMessages}`);
                } else {
                    alert('Please check all required fields are filled correctly.');
                }
                
                // Scroll to first error
                const firstError = Object.keys(formErrors).find(key => formErrors[key as keyof typeof formErrors]);
                if (firstError) {
                    const element = document.querySelector(`[name="${firstError}"]`) || 
                                   document.querySelector(`[id="${firstError}"]`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }
        } else {
            // Show manual validation errors
            console.error('Manual validation failed:', errors);
            alert(`Please fix the following errors:\n\n${errors.join('\n')}`);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={handleFormSubmit} className="space-y-8">
                {/* Assignment Type */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <ShoppingBasket className="h-5 w-5 text-primary" />
                            Assignment Type
                        </CardTitle>
                        <CardDescription>
                            Select whether this equipment is assigned to a booking or a basket.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        {!defaultBasketId && !defaultBookingId && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="booking_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Booking (Optional)</FormLabel>
                                            <Select 
                                                onValueChange={field.onChange} 
                                                value={field.value}
                                                disabled={!!form.watch('basket_id')}
                                            >
                                                <FormControl>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                        <SelectTrigger className="pl-9">
                                                            <SelectValue placeholder="Select booking (optional)" />
                                                        </SelectTrigger>
                                                    </div>
                                                </FormControl>
                                                <SelectContent>
                                                    {bookings.map((booking) => (
                                                        <SelectItem key={booking.id} value={String(booking.id)}>
                                                            {booking.customer?.full_name || `Booking #${booking.id}`} - {safeFormatDate(booking.booking_date || booking.start_date, "MMM d, yyyy", "No date")}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="text-center text-sm text-muted-foreground">OR</div>
                                <FormField
                                    control={form.control}
                                    name="basket_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Basket (Optional)</FormLabel>
                                            <Select 
                                                onValueChange={field.onChange} 
                                                value={field.value}
                                                disabled={!!form.watch('booking_id')}
                                            >
                                                <FormControl>
                                                    <div className="relative">
                                                        <ShoppingBasket className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                        <SelectTrigger className="pl-9">
                                                            <SelectValue placeholder="Select basket (optional)" />
                                                        </SelectTrigger>
                                                    </div>
                                                </FormControl>
                                                <SelectContent>
                                                    {baskets.map((basket) => (
                                                        <SelectItem key={basket.id} value={String(basket.id)}>
                                                            {basket.basket_no} - {basket.customer?.full_name || 'Unknown Customer'}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}
                        {(defaultBasketId || defaultBookingId) && (
                            <div className="p-3 bg-muted rounded-md">
                                <p className="text-sm">
                                    {defaultBasketId ? `Basket: ${baskets.find(b => b.id === defaultBasketId)?.basket_no || `#${defaultBasketId}`}` : ''}
                                    {defaultBookingId ? `Booking: #${defaultBookingId}` : ''}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Equipment Source */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            Equipment Source
                        </CardTitle>
                        <CardDescription>
                            Select whether this is center equipment or customer's own equipment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="equipment_source"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            className="flex gap-6"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="Center" id="center" />
                                                <Label htmlFor="center" className="cursor-pointer">Center Equipment (Rental)</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="Customer Own" id="customer-own" />
                                                <Label htmlFor="customer-own" className="cursor-pointer">Customer Own Equipment</Label>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Center Equipment Fields */}
                {equipmentSource === 'Center' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Center Equipment Details</CardTitle>
                            <CardDescription>
                                Select the equipment item from the center's inventory.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <FormField
                                control={form.control}
                                name="equipment_item_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Equipment Item *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <div className="relative">
                                                    <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                    <SelectTrigger className="pl-9">
                                                        <SelectValue placeholder="Select equipment item" />
                                                    </SelectTrigger>
                                                </div>
                                            </FormControl>
                                            <SelectContent>
                                                {equipmentItems.map((item) => (
                                                    <SelectItem key={item.id} value={String(item.id)}>
                                                        {item.equipment?.name || 'Equipment'} - {item.size || 'N/A'} {item.status ? `(${item.status})` : ''}
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
                                        <FormLabel>Rental Price</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    type="number" 
                                                    placeholder="0.00" 
                                                    className="pl-9" 
                                                    {...field}
                                                    step="0.01"
                                                    min="0"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            Leave empty or set to 0 for free rental
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Customer Equipment Fields */}
                {equipmentSource === 'Customer Own' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Customer Equipment Details</CardTitle>
                            <CardDescription>
                                Enter details about the customer's own equipment.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="customer_equipment_type"
                                    render={({ field }) => {
                                        const standardTypes = ["BCD", "Regulator", "Wetsuit", "Dry Suit", "Mask", "Fins", "Snorkel", "Dive Computer", "Dive Watch", "Torch/Flashlight", "Weight Belt", "Tank", "Camera"];
                                        const isCustomType = Boolean(field.value && !standardTypes.includes(field.value));
                                        
                                        return (
                                            <FormItem>
                                                <FormLabel>Equipment Type (Select from List)</FormLabel>
                                                <Select 
                                                    onValueChange={(value) => {
                                                        if (value === "Other") {
                                                            // Clear dropdown selection when "Other" is chosen
                                                            field.onChange("");
                                                        } else {
                                                            field.onChange(value);
                                                        }
                                                    }} 
                                                    value={isCustomType ? "" : field.value}
                                                    disabled={isCustomType}
                                                >
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                            <SelectTrigger className="pl-9">
                                                                <SelectValue placeholder="Select from list (optional)" />
                                                            </SelectTrigger>
                                                        </div>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="BCD">BCD (Buoyancy Control Device)</SelectItem>
                                                        <SelectItem value="Regulator">Regulator</SelectItem>
                                                        <SelectItem value="Wetsuit">Wetsuit</SelectItem>
                                                        <SelectItem value="Dry Suit">Dry Suit</SelectItem>
                                                        <SelectItem value="Mask">Mask</SelectItem>
                                                        <SelectItem value="Fins">Fins</SelectItem>
                                                        <SelectItem value="Snorkel">Snorkel</SelectItem>
                                                        <SelectItem value="Dive Computer">Dive Computer</SelectItem>
                                                        <SelectItem value="Dive Watch">Dive Watch</SelectItem>
                                                        <SelectItem value="Torch/Flashlight">Torch/Flashlight</SelectItem>
                                                        <SelectItem value="Weight Belt">Weight Belt</SelectItem>
                                                        <SelectItem value="Tank">Tank</SelectItem>
                                                        <SelectItem value="Camera">Camera</SelectItem>
                                                        <SelectItem value="Other">Other (use custom field)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    Select from common types
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        );
                                    }}
                                />

                                <FormField
                                    control={form.control}
                                    name="customer_equipment_type"
                                    render={({ field }) => {
                                        const standardTypes = ["BCD", "Regulator", "Wetsuit", "Dry Suit", "Mask", "Fins", "Snorkel", "Dive Computer", "Dive Watch", "Torch/Flashlight", "Weight Belt", "Tank", "Camera"];
                                        const isCustomType = Boolean(field.value && !standardTypes.includes(field.value));
                                        
                                        return (
                                            <FormItem>
                                                <FormLabel>Custom Equipment Type</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="Type custom equipment name (e.g., Reel, SMB, etc.)" 
                                                        value={isCustomType ? field.value : ""}
                                                        onChange={(e) => {
                                                            const customValue = e.target.value;
                                                            // Only clear if completely empty (after trimming), but preserve spaces in the value
                                                            if (customValue.trim() === "") {
                                                                field.onChange("");
                                                            } else {
                                                                // Preserve all spaces including leading/trailing
                                                                field.onChange(customValue);
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Enter custom type if not in the list above
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        );
                                    }}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="customer_equipment_brand"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Brand *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Scubapro, Aqualung" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="customer_equipment_model"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Model</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., MK25, Legend" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="customer_equipment_serial"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Serial Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Serial number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="customer_equipment_notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Additional notes about the equipment..." 
                                                {...field}
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Date Range */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Rental Period
                        </CardTitle>
                        <CardDescription>
                            Set the checkout and return dates for this equipment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="checkout_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Checkout Date</FormLabel>
                                    <FormControl>
                                        <DatePicker
                                            selected={field.value ? (safeParseDate(field.value) ?? null) : null}
                                            onChange={(date) => {
                                                if (date) {
                                                    const year = date.getFullYear();
                                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                                    const day = String(date.getDate()).padStart(2, '0');
                                                    field.onChange(`${year}-${month}-${day}`);
                                                } else {
                                                    field.onChange("");
                                                }
                                            }}
                                            dateFormat="yyyy-MM-dd"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholderText="Select checkout date"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="return_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Return Date</FormLabel>
                                    <FormControl>
                                        <DatePicker
                                            selected={field.value ? (safeParseDate(field.value) ?? null) : null}
                                            onChange={(date) => {
                                                if (date) {
                                                    const year = date.getFullYear();
                                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                                    const day = String(date.getDate()).padStart(2, '0');
                                                    field.onChange(`${year}-${month}-${day}`);
                                                } else {
                                                    field.onChange("");
                                                }
                                            }}
                                            dateFormat="yyyy-MM-dd"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            placeholderText="Select return date"
                                            minDate={checkoutDate ? new Date(checkoutDate) : undefined}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Availability Check (Center Equipment Only) */}
                {equipmentSource === 'Center' && equipmentItemId && checkoutDate && returnDate && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Availability Check</CardTitle>
                            <CardDescription>
                                Check if this equipment is available for the selected dates.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCheckAvailability}
                                disabled={checkingAvailability}
                            >
                                {checkingAvailability ? "Checking..." : "Check Availability"}
                            </Button>

                            {availabilityCheck && (
                                <Alert className={availabilityCheck.available ? "border-green-500" : "border-red-500"}>
                                    <div className="flex items-center gap-2">
                                        {availabilityCheck.available ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500" />
                                        )}
                                        <AlertDescription>
                                            {availabilityCheck.available ? (
                                                <span className="text-green-700 dark:text-green-400">
                                                    Equipment is available for the selected dates.
                                                </span>
                                            ) : (
                                                <div className="space-y-2">
                                                    <span className="text-red-700 dark:text-red-400 font-semibold">
                                                        Equipment is not available for the selected dates.
                                                    </span>
                                                    {availabilityCheck.conflicting_assignments && availabilityCheck.conflicting_assignments.length > 0 && (
                                                        <div className="mt-2">
                                                            <p className="text-sm font-medium">Conflicting assignments:</p>
                                                            <ul className="list-disc list-inside text-sm space-y-1">
                                                                {availabilityCheck.conflicting_assignments.map((conflict, idx) => (
                                                                    <li key={idx}>
                                                                        {conflict.customer_name} ({safeFormatDate(conflict.checkout_date, "MMM d, yyyy", "N/A")} - {safeFormatDate(conflict.return_date, "MMM d, yyyy", "N/A")})
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </AlertDescription>
                                    </div>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        size="lg" 
                        disabled={loading}
                    >
                        {loading ? "Saving..." : (bookingEquipmentId ? "Update Booking Equipment" : "Create Booking Equipment")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
