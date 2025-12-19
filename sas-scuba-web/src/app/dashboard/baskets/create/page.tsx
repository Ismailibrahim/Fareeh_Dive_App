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
import { equipmentBasketService, CreateBasketRequest } from "@/lib/api/services/equipment-basket.service";
import { customerService, Customer } from "@/lib/api/services/customer.service";
import { bookingService, Booking } from "@/lib/api/services/booking.service";
import { equipmentItemService, EquipmentItem } from "@/lib/api/services/equipment-item.service";
import { bookingEquipmentService, BookingEquipmentFormData } from "@/lib/api/services/booking-equipment.service";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { ShoppingBasket, User, Calendar, ArrowLeft, Plus, X, Package, Search, Check, ChevronsUpDown, AlertCircle } from "lucide-react";
import DatePicker from "react-datepicker";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

const basketSchema = z.object({
    customer_id: z.string().min(1, "Customer is required"),
    booking_id: z.string().optional(),
    center_bucket_no: z.string().optional(),
    expected_return_date: z.string().optional(),
    notes: z.string().optional(),
});

interface EquipmentItemToAdd {
    id: string; // temporary ID for list
    equipment_source: 'Center' | 'Customer Own';
    equipment_item_id?: number;
    customer_equipment_type?: string;
    customer_equipment_brand?: string;
    customer_equipment_model?: string;
    customer_equipment_serial?: string;
    customer_equipment_notes?: string;
    price?: number;
}

export default function CreateBasketPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
    const [itemsToAdd, setItemsToAdd] = useState<EquipmentItemToAdd[]>([]);
    
    // Search and filter states for equipment selector
    const [equipmentSearchOpen, setEquipmentSearchOpen] = useState<{ [key: string]: boolean }>({});
    const [equipmentSearchTerm, setEquipmentSearchTerm] = useState<{ [key: string]: string }>({});
    const [equipmentSizeFilter, setEquipmentSizeFilter] = useState<{ [key: string]: string }>({});
    
    // Availability check states
    const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
    const [availabilityCheckLoading, setAvailabilityCheckLoading] = useState(false);
    const [availabilityError, setAvailabilityError] = useState<{
        equipmentName: string;
        conflicts?: Array<{
            customer_name: string;
            basket_no?: string;
            checkout_date: string;
            return_date: string;
            assignment_status: string;
        }>;
        checkoutDate: string;
        returnDate: string;
    } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const customerData = await customerService.getAll();
                const customerList = Array.isArray(customerData) ? customerData : (customerData as any).data || [];
                setCustomers(customerList);

                const bookingData = await bookingService.getAll();
                const bookingList = Array.isArray(bookingData) ? bookingData : (bookingData as any).data || [];
                setBookings(bookingList);

                const equipmentData = await equipmentItemService.getAll(1, undefined, 'Available');
                const equipmentList = Array.isArray(equipmentData) ? equipmentData : (equipmentData as any).data || [];
                setEquipmentItems(equipmentList);
            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        fetchData();
    }, []);

    const form = useForm<CreateBasketRequest>({
        resolver: zodResolver(basketSchema),
        defaultValues: {
            customer_id: "",
            booking_id: "",
            center_bucket_no: "",
            expected_return_date: "",
            notes: "",
        },
    });

    const parseDate = (dateString: string | undefined): Date | null => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    };

    const formatDateToString = (date: Date | null): string => {
        if (!date) return "";
        return date.toISOString().split('T')[0];
    };

    // Helper function to remove undefined values from object
    const removeUndefined = <T extends Record<string, any>>(obj: T): Partial<T> => {
        const cleaned: Partial<T> = {};
        Object.keys(obj).forEach(key => {
            if (obj[key] !== undefined) {
                cleaned[key as keyof T] = obj[key];
            }
        });
        return cleaned;
    };

    const addCenterEquipmentItem = () => {
        const newItem: EquipmentItemToAdd = {
            id: `center-${Date.now()}`,
            equipment_source: 'Center',
            equipment_item_id: undefined,
            price: 0,
        };
        setItemsToAdd([...itemsToAdd, newItem]);
    };

    const addCustomerEquipmentItem = () => {
        const newItem: EquipmentItemToAdd = {
            id: `customer-${Date.now()}`,
            equipment_source: 'Customer Own',
            customer_equipment_brand: '',
            price: 0,
        };
        setItemsToAdd([...itemsToAdd, newItem]);
    };

    const removeItem = (id: string) => {
        setItemsToAdd(itemsToAdd.filter(item => item.id !== id));
    };

    const updateItem = (id: string, updates: Partial<EquipmentItemToAdd>) => {
        setItemsToAdd(itemsToAdd.map(item => 
            item.id === id ? { ...item, ...updates } : item
        ));
    };

    // Get unique sizes from equipment items
    const availableSizes = useMemo(() => {
        const sizes = new Set<string>();
        equipmentItems.forEach(item => {
            if (item.size) {
                sizes.add(item.size);
            }
        });
        return Array.from(sizes).sort();
    }, [equipmentItems]);

    // Filter equipment items based on search and size
    const getFilteredEquipmentItems = (itemId: string) => {
        let filtered = equipmentItems;
        
        const searchTerm = equipmentSearchTerm[itemId]?.toLowerCase() || '';
        const sizeFilter = equipmentSizeFilter[itemId];
        
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.equipment?.name?.toLowerCase().includes(searchTerm) ||
                item.brand?.toLowerCase().includes(searchTerm) ||
                item.serial_no?.toLowerCase().includes(searchTerm) ||
                item.inventory_code?.toLowerCase().includes(searchTerm) ||
                item.size?.toLowerCase().includes(searchTerm)
            );
        }
        
        if (sizeFilter && sizeFilter !== 'all') {
            filtered = filtered.filter(item => item.size === sizeFilter);
        }
        
        return filtered;
    };

    // Get selected equipment item display name
    const getSelectedEquipmentName = (equipmentItemId?: number) => {
        if (!equipmentItemId) return "Select equipment";
        const item = equipmentItems.find(eq => eq.id === equipmentItemId);
        if (!item) return "Select equipment";
        return `${item.equipment?.name || 'Equipment'} - ${item.size || 'N/A'} (${item.status})`;
    };

    // Check equipment availability before selection
    const handleEquipmentSelection = async (itemId: string, equipmentItemId: number) => {
        const selectedEquipment = equipmentItems.find(eq => eq.id === equipmentItemId);
        if (!selectedEquipment) return;

        // Check if equipment status is not Available
        if (selectedEquipment.status !== 'Available') {
            setAvailabilityError({
                equipmentName: `${selectedEquipment.equipment?.name || 'Equipment'}${selectedEquipment.size ? ` (Size: ${selectedEquipment.size})` : ''}`,
                checkoutDate: formatDateToString(new Date()),
                returnDate: form.watch('expected_return_date') || formatDateToString(new Date(new Date().setDate(new Date().getDate() + 1))),
            });
            setAvailabilityDialogOpen(true);
            return;
        }

        // Check availability using API
        const checkoutDate = new Date();
        const expectedReturnDate = form.watch('expected_return_date');
        const returnDate = expectedReturnDate 
            ? parseDate(expectedReturnDate)
            : new Date(new Date().setDate(new Date().getDate() + 1)); // Default to tomorrow if no return date

        setAvailabilityCheckLoading(true);
        try {
            const availability = await bookingEquipmentService.checkAvailability({
                equipment_item_id: equipmentItemId,
                checkout_date: formatDateToString(checkoutDate),
                return_date: formatDateToString(returnDate),
            });

            if (!availability.available) {
                // Equipment is not available, show modal
                setAvailabilityError({
                    equipmentName: `${selectedEquipment.equipment?.name || 'Equipment'}${selectedEquipment.size ? ` (Size: ${selectedEquipment.size})` : ''}`,
                    conflicts: availability.conflicting_assignments,
                    checkoutDate: formatDateToString(checkoutDate),
                    returnDate: formatDateToString(returnDate),
                });
                setAvailabilityDialogOpen(true);
            } else {
                // Equipment is available, proceed with selection
                updateItem(itemId, { equipment_item_id: equipmentItemId });
                setEquipmentSearchOpen({ ...equipmentSearchOpen, [itemId]: false });
                setEquipmentSearchTerm({ ...equipmentSearchTerm, [itemId]: "" });
                setEquipmentSizeFilter({ ...equipmentSizeFilter, [itemId]: "all" });
            }
        } catch (error: any) {
            console.error("Failed to check availability", error);
            // On error, still allow selection but show warning
            const errorMessage = error?.response?.data?.message || "Could not verify availability. Proceeding with selection.";
            alert(errorMessage);
            updateItem(itemId, { equipment_item_id: equipmentItemId });
            setEquipmentSearchOpen({ ...equipmentSearchOpen, [itemId]: false });
            setEquipmentSearchTerm({ ...equipmentSearchTerm, [itemId]: "" });
            setEquipmentSizeFilter({ ...equipmentSizeFilter, [itemId]: "all" });
        } finally {
            setAvailabilityCheckLoading(false);
        }
    };

    async function onSubmit(data: z.infer<typeof basketSchema>) {
        setLoading(true);
        try {
            // Validate equipment items if any are added
            for (const item of itemsToAdd) {
                if (item.equipment_source === 'Center' && !item.equipment_item_id) {
                    alert("Please select equipment item for all center equipment");
                    setLoading(false);
                    return;
                }
                if (item.equipment_source === 'Customer Own' && !item.customer_equipment_brand) {
                    alert("Please enter brand for all customer equipment");
                    setLoading(false);
                    return;
                }
            }

            // Create basket first
            const payload: CreateBasketRequest = {
                customer_id: parseInt(data.customer_id),
                booking_id: data.booking_id && data.booking_id !== "" && data.booking_id !== "none" 
                    ? parseInt(data.booking_id) 
                    : undefined,
                center_bucket_no: data.center_bucket_no && data.center_bucket_no.trim() !== "" 
                    ? data.center_bucket_no.trim() 
                    : undefined,
                expected_return_date: data.expected_return_date && data.expected_return_date.trim() !== "" 
                    ? data.expected_return_date.trim() 
                    : undefined,
                notes: data.notes && data.notes.trim() !== "" 
                    ? data.notes.trim() 
                    : undefined,
            };

            const basket = await equipmentBasketService.create(payload);

            // Add equipment items if any were selected
            if (itemsToAdd.length > 0) {
                try {
                    // Filter out invalid items before processing
                    const validItems = itemsToAdd.filter(item => {
                        if (item.equipment_source === 'Center') {
                            return !!item.equipment_item_id; // Must have equipment_item_id
                        } else {
                            return !!item.customer_equipment_brand; // Must have brand for Customer Own
                        }
                    });

                    if (validItems.length !== itemsToAdd.length) {
                        alert("Some equipment items were invalid and were skipped. Please ensure all Center equipment has an item selected and all Customer Own equipment has a brand.");
                    }

                    if (validItems.length === 0) {
                        // No valid items to add, just redirect
                        router.push(`/dashboard/baskets/${basket.id}?refresh=true`);
                        return;
                    }

                    const checkoutDate = new Date(); // Use today's date as checkout date
                    const promises = validItems.map(item => {
                        // Build payload, only including defined values
                        const equipmentPayload: BookingEquipmentFormData = {
                            basket_id: basket.id,
                            equipment_source: item.equipment_source,
                            checkout_date: formatDateToString(checkoutDate),
                            price: item.price || 0,
                        };

                        // Add booking_id if available
                        if (basket.booking_id) {
                            equipmentPayload.booking_id = basket.booking_id;
                        }

                        // Add return_date if provided
                        if (data.expected_return_date && data.expected_return_date.trim() !== "") {
                            equipmentPayload.return_date = data.expected_return_date.trim();
                        }

                        // For Center equipment, include equipment_item_id
                        if (item.equipment_source === 'Center') {
                            if (item.equipment_item_id) {
                                equipmentPayload.equipment_item_id = item.equipment_item_id;
                            }
                        } else {
                            // For Customer Own equipment, explicitly set equipment_item_id to null
                            // (API will handle this, but we ensure it's not undefined)
                            equipmentPayload.equipment_item_id = undefined;
                        }

                        // For Customer Own equipment, include customer equipment fields
                        if (item.equipment_source === 'Customer Own') {
                            if (item.customer_equipment_type) {
                                equipmentPayload.customer_equipment_type = item.customer_equipment_type;
                            }
                            if (item.customer_equipment_brand) {
                                equipmentPayload.customer_equipment_brand = item.customer_equipment_brand;
                            }
                            if (item.customer_equipment_model) {
                                equipmentPayload.customer_equipment_model = item.customer_equipment_model;
                            }
                            if (item.customer_equipment_serial) {
                                equipmentPayload.customer_equipment_serial = item.customer_equipment_serial;
                            }
                            if (item.customer_equipment_notes) {
                                equipmentPayload.customer_equipment_notes = item.customer_equipment_notes;
                            }
                        }

                        // Remove undefined values before sending
                        const cleanedPayload = removeUndefined(equipmentPayload);
                        return bookingEquipmentService.create(cleanedPayload as BookingEquipmentFormData);
                    });

                    await Promise.all(promises);
                    console.log(`Successfully added ${validItems.length} equipment items to basket ${basket.id}`);
                } catch (equipmentError: any) {
                    console.error("Failed to add equipment items", equipmentError);
                    // Basket was created successfully, but equipment items failed
                    // Still redirect to basket page so user can add items manually
                    let equipmentErrorMessage = "Basket created successfully, but some equipment items failed to add.\n\n";
                    
                    // Check if this is a validation error (422)
                    if (equipmentError?.response?.status === 422) {
                        const errorData = equipmentError.response.data;
                        
                        // Check if this is an availability error with conflicts
                        if (errorData?.conflicting_assignments) {
                            const conflicts = errorData.conflicting_assignments;
                            equipmentErrorMessage += errorData.message || "Equipment is not available for the requested dates.\n\n";
                            equipmentErrorMessage += `Requested dates: ${errorData.checkout_date} to ${errorData.return_date}\n\n`;
                            equipmentErrorMessage += "Conflicting assignments:\n";
                            conflicts.forEach((conflict: any, index: number) => {
                                equipmentErrorMessage += `\n${index + 1}. Customer: ${conflict.customer_name}`;
                                if (conflict.basket_no) {
                                    equipmentErrorMessage += ` (Basket: ${conflict.basket_no})`;
                                }
                                equipmentErrorMessage += `\n   Dates: ${conflict.checkout_date} to ${conflict.return_date}`;
                                equipmentErrorMessage += `\n   Status: ${conflict.assignment_status}`;
                            });
                            equipmentErrorMessage += "\n\nYou can add items manually to the basket.";
                        } else {
                            // Handle validation errors
                            equipmentErrorMessage += errorData.message || "Validation error occurred.\n\n";
                            
                            // Include validation errors if present
                            if (errorData.errors) {
                                const validationErrors = Object.entries(errorData.errors)
                                    .map(([field, messages]: [string, any]) => {
                                        const messageList = Array.isArray(messages) ? messages.join(", ") : messages;
                                        return `${field}: ${messageList}`;
                                    })
                                    .join("\n");
                                equipmentErrorMessage += `Validation errors:\n${validationErrors}\n\n`;
                            }
                            
                            equipmentErrorMessage += "You can add items manually to the basket.";
                        }
                    } else {
                        equipmentErrorMessage += equipmentError?.response?.data?.message || 
                            equipmentError?.message || 
                            "You can add them manually.";
                    }
                    alert(equipmentErrorMessage);
                    router.push(`/dashboard/baskets/${basket.id}?refresh=true`);
                    return;
                }
            }

            // Add a small delay to ensure data is persisted before redirecting
            await new Promise(resolve => setTimeout(resolve, 500));
            router.push(`/dashboard/baskets/${basket.id}?refresh=true`);
        } catch (error: any) {
            console.error("Failed to create basket", error);
            
            // Extract error message from API response
            let errorMessage = "Failed to create basket. Please try again.";
            
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
            // Show validation errors if present
            if (error?.response?.data?.errors) {
                const validationErrors = Object.values(error.response.data.errors).flat();
                errorMessage = validationErrors.join("\n");
            }
            
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="New Equipment Basket" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/baskets">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Create Equipment Basket</h2>
                        <p className="text-muted-foreground">Create a new equipment basket for a customer</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <ShoppingBasket className="h-5 w-5 text-primary" />
                                        Basket Information
                                    </CardTitle>
                                    <CardDescription>
                                        A unique basket number will be automatically generated
                                    </CardDescription>
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

                            <FormField
                                control={form.control}
                                name="booking_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Booking (Optional)</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                                            value={field.value === "" || !field.value ? "none" : field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select booking (optional)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {bookings.map((booking) => (
                                                    <SelectItem key={booking.id} value={String(booking.id)}>
                                                        {booking.customer?.full_name || `Booking #${booking.id}`} - {booking.booking_date ? format(new Date(booking.booking_date), "MMM d, yyyy") : "No date"}
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
                                name="center_bucket_no"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Center Bucket No (Optional)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter your center's bucket number"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="expected_return_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Expected Return Date (Optional)</FormLabel>
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
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Add any additional notes..."
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

                            {/* Equipment Items Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Package className="h-5 w-5 text-primary" />
                                        Equipment Items (Optional)
                                    </CardTitle>
                                    <CardDescription>
                                        Add equipment items to this basket. You can add items after creation as well.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" onClick={addCenterEquipmentItem}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Center Equipment
                                        </Button>
                                        <Button type="button" variant="outline" onClick={addCustomerEquipmentItem}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Customer Equipment
                                        </Button>
                                    </div>

                                    {itemsToAdd.length === 0 ? (
                                        <div className="text-center py-6 text-muted-foreground text-sm">
                                            No equipment items added yet. Click the buttons above to add items.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {itemsToAdd.map((item, index) => (
                                                <div key={item.id} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={item.equipment_source === 'Center' ? 'default' : 'secondary'}>
                                                                {item.equipment_source === 'Center' ? 'Center Equipment' : 'Customer Own'}
                                                            </Badge>
                                                            <span className="text-sm font-medium">Item {index + 1}</span>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeItem(item.id)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    {item.equipment_source === 'Center' ? (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <Label className="text-sm">Equipment Item *</Label>
                                                                <Popover
                                                                    open={equipmentSearchOpen[item.id] || false}
                                                                    onOpenChange={(open) => setEquipmentSearchOpen({ ...equipmentSearchOpen, [item.id]: open })}
                                                                >
                                                                    <PopoverTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            role="combobox"
                                                                            className={cn(
                                                                "w-full justify-between",
                                                                !item.equipment_item_id && "text-muted-foreground"
                                                            )}
                                                                        >
                                                                            {getSelectedEquipmentName(item.equipment_item_id)}
                                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-[400px] p-0" align="start">
                                                                        <div className="flex flex-col gap-2 p-3 border-b">
                                                                            <div className="flex items-center gap-2">
                                                                                <Search className="h-4 w-4 text-muted-foreground" />
                                                                                <Input
                                                                                    placeholder="Search equipment..."
                                                                                    value={equipmentSearchTerm[item.id] || ""}
                                                                                    onChange={(e) => setEquipmentSearchTerm({ ...equipmentSearchTerm, [item.id]: e.target.value })}
                                                                                    className="h-8"
                                                                                />
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <Label className="text-xs text-muted-foreground whitespace-nowrap">Filter by size:</Label>
                                                                                <Select
                                                                                    value={equipmentSizeFilter[item.id] || "all"}
                                                                                    onValueChange={(value) => setEquipmentSizeFilter({ ...equipmentSizeFilter, [item.id]: value })}
                                                                                >
                                                                                    <SelectTrigger className="h-8">
                                                                                        <SelectValue placeholder="All sizes" />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="all">All sizes</SelectItem>
                                                                                        {availableSizes.map((size) => (
                                                                                            <SelectItem key={size} value={size}>
                                                                                                {size}
                                                                                            </SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>
                                                                        </div>
                                                                        <div className="max-h-[300px] overflow-auto">
                                                                            {getFilteredEquipmentItems(item.id).length === 0 ? (
                                                                                <div className="p-4 text-center text-sm text-muted-foreground">
                                                                                    No equipment found
                                                                                </div>
                                                                            ) : (
                                                                                <div className="p-1">
                                                                                    {getFilteredEquipmentItems(item.id).map((eqItem) => (
                                                                                        <div
                                                                                            key={eqItem.id}
                                                                                            className={cn(
                                                                                                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                                                                item.equipment_item_id === eqItem.id && "bg-accent",
                                                                                                eqItem.status !== 'Available' && "opacity-60",
                                                                                                availabilityCheckLoading && "opacity-50 cursor-wait"
                                                                                            )}
                                                                                            onClick={() => {
                                                                                                if (!availabilityCheckLoading) {
                                                                                                    handleEquipmentSelection(item.id, eqItem.id);
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <Check
                                                                                                className={cn(
                                                                                                    "mr-2 h-4 w-4",
                                                                                                    item.equipment_item_id === eqItem.id ? "opacity-100" : "opacity-0"
                                                                                                )}
                                                                                            />
                                                                                            <div className="flex-1">
                                                                                                <div className={cn(
                                                                                                    "font-medium",
                                                                                                    eqItem.status !== 'Available' && "text-muted-foreground"
                                                                                                )}>
                                                                                                    {eqItem.equipment?.name || 'Equipment'}
                                                                                                </div>
                                                                                                <div className="text-xs text-muted-foreground">
                                                                                                    {eqItem.size && `Size: ${eqItem.size}`}
                                                                                                    {eqItem.brand && ` • Brand: ${eqItem.brand}`}
                                                                                                    {eqItem.serial_no && ` • Serial: ${eqItem.serial_no}`}
                                                                                                    {!eqItem.size && !eqItem.brand && !eqItem.serial_no && `Status: ${eqItem.status}`}
                                                                                                </div>
                                                                                            </div>
                                                                                            <Badge 
                                                                                                variant={
                                                                                                    eqItem.status === 'Available' 
                                                                                                        ? 'default' 
                                                                                                        : eqItem.status === 'Rented' 
                                                                                                        ? 'secondary' 
                                                                                                        : 'destructive'
                                                                                                } 
                                                                                                className="ml-2"
                                                            >
                                                                                                {eqItem.status}
                                                                                            </Badge>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </PopoverContent>
                                                                </Popover>
                                                            </div>
                                                            <div>
                                                                <Label className="text-sm">Price</Label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={item.price || 0}
                                                                    onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <Label className="text-sm">Equipment Type</Label>
                                                                <Select
                                                                    value={item.customer_equipment_type || ""}
                                                                    onValueChange={(value) => updateItem(item.id, { customer_equipment_type: value })}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select type (optional)" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="BCD">BCD</SelectItem>
                                                                        <SelectItem value="Regulator">Regulator</SelectItem>
                                                                        <SelectItem value="Wetsuit">Wetsuit</SelectItem>
                                                                        <SelectItem value="Dry Suit">Dry Suit</SelectItem>
                                                                        <SelectItem value="Mask">Mask</SelectItem>
                                                                        <SelectItem value="Fins">Fins</SelectItem>
                                                                        <SelectItem value="Snorkel">Snorkel</SelectItem>
                                                                        <SelectItem value="Dive Computer">Dive Computer</SelectItem>
                                                                        <SelectItem value="Other">Other</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div>
                                                                <Label className="text-sm">Brand *</Label>
                                                                <Input
                                                                    value={item.customer_equipment_brand || ""}
                                                                    onChange={(e) => updateItem(item.id, { customer_equipment_brand: e.target.value })}
                                                                    placeholder="e.g., Scubapro"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-sm">Model</Label>
                                                                <Input
                                                                    value={item.customer_equipment_model || ""}
                                                                    onChange={(e) => updateItem(item.id, { customer_equipment_model: e.target.value })}
                                                                    placeholder="e.g., MK25"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-sm">Serial Number</Label>
                                                                <Input
                                                                    value={item.customer_equipment_serial || ""}
                                                                    onChange={(e) => updateItem(item.id, { customer_equipment_serial: e.target.value })}
                                                                    placeholder="Serial number"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-sm">Price</Label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={item.price || 0}
                                                                    onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="flex justify-end gap-4">
                                <Button type="button" variant="outline" onClick={() => router.back()}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Creating..." : "Create Basket"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>

            {/* Availability Check Dialog */}
            <AlertDialog open={availabilityDialogOpen} onOpenChange={setAvailabilityDialogOpen}>
                <AlertDialogContent className="max-w-2xl">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                                <AlertDialogTitle className="text-xl">Equipment Not Available</AlertDialogTitle>
                                <AlertDialogDescription className="mt-1">
                                    The selected equipment item is not available for the requested dates.
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    
                    {availabilityError && (
                        <div className="space-y-4">
                            <div className="rounded-lg border bg-muted/50 p-4">
                                <div className="font-semibold text-sm mb-2">Selected Equipment:</div>
                                <div className="text-sm">{availabilityError.equipmentName}</div>
                            </div>

                            <div className="rounded-lg border bg-muted/50 p-4">
                                <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Requested Dates:
                                </div>
                                <div className="text-sm">
                                    {format(new Date(availabilityError.checkoutDate), "PPP")} to {format(new Date(availabilityError.returnDate), "PPP")}
                                </div>
                            </div>

                            {availabilityError.conflicts && availabilityError.conflicts.length > 0 && (
                                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                                    <div className="font-semibold text-sm mb-3 text-destructive">Conflicting Assignments:</div>
                                    <div className="space-y-3">
                                        {availabilityError.conflicts.map((conflict, index) => (
                                            <div key={index} className="text-sm border-l-2 border-destructive/30 pl-3">
                                                <div className="font-medium">{index + 1}. Customer: {conflict.customer_name}</div>
                                                {conflict.basket_no && (
                                                    <div className="text-muted-foreground">Basket: {conflict.basket_no}</div>
                                                )}
                                                <div className="text-muted-foreground">
                                                    Dates: {format(new Date(conflict.checkout_date), "PPP")} to {format(new Date(conflict.return_date), "PPP")}
                                                </div>
                                                <div className="text-muted-foreground">Status: {conflict.assignment_status}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                                    <div className="text-sm">
                                        <div className="font-semibold mb-1">Please choose another equipment item</div>
                                        <div className="text-muted-foreground">
                                            This equipment is already assigned to another customer during the requested period. 
                                            Please select a different item from the list.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setAvailabilityDialogOpen(false)}>
                            I Understand
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

