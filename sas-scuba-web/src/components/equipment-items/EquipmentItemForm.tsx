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
import { equipmentItemService, EquipmentItemFormData, EquipmentItem } from "@/lib/api/services/equipment-item.service";
import { equipmentService, Equipment } from "@/lib/api/services/equipment.service";
import { locationService, Location } from "@/lib/api/services/location.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Ruler, Hash, CheckCircle, Barcode, Tag, Palette, CalendarIcon, Wrench, Calculator, MapPin } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { SafeDatePicker as DatePicker } from "@/components/ui/safe-date-picker";
import { cn } from "@/lib/utils";
import { EquipmentItemImageUpload } from "./EquipmentItemImageUpload";

const equipmentItemSchema = z.object({
    equipment_id: z.string().min(1, "Equipment is required"),
    location_id: z.string().optional().or(z.literal("")),
    size: z.string().optional(),
    serial_no: z.string().optional(),
    inventory_code: z.string().optional(),
    brand: z.string().optional(),
    color: z.string().optional(),
    image_url: z.string().optional(),
    status: z.enum(['Available', 'Rented', 'Maintenance']),
    purchase_date: z.string().optional(),
    requires_service: z.boolean().optional(),
    service_interval_days: z.string().optional(),
    last_service_date: z.string().optional(),
    next_service_date: z.string().optional(),
});

// Form values type (matches schema)
type EquipmentItemFormValues = z.infer<typeof equipmentItemSchema>;

interface EquipmentItemFormProps {
    initialData?: EquipmentItem;
    equipmentItemId?: string | number;
}

export function EquipmentItemForm({ initialData, equipmentItemId }: EquipmentItemFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [availableSizes, setAvailableSizes] = useState<string[]>([]);
    const [availableBrands, setAvailableBrands] = useState<string[]>([]);

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                // Fetch all equipment with a high per_page to get all items
                // Add timestamp to bypass browser cache if needed
                const data = await equipmentService.getAll({ per_page: 1000 });
                const list = Array.isArray(data) ? data : (data as any).data || [];
                setEquipment(list);
                
                // If editing and initialData has equipment_id, load sizes and brands for that equipment
                if (initialData?.equipment_id) {
                    const initialEquipment = list.find((eq) => {
                        return eq.id === initialData.equipment_id || String(eq.id) === String(initialData.equipment_id);
                    });
                    if (initialEquipment?.sizes && Array.isArray(initialEquipment.sizes) && initialEquipment.sizes.length > 0) {
                        setAvailableSizes(initialEquipment.sizes);
                    }
                    if (initialEquipment?.brands && Array.isArray(initialEquipment.brands) && initialEquipment.brands.length > 0) {
                        setAvailableBrands(initialEquipment.brands);
                    }
                }
            } catch (error) {
                console.error("Failed to load equipment", error);
            }
        };
        fetchEquipment();
    }, [initialData]);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const data = await locationService.getAll();
                const list = Array.isArray(data) ? data : [];
                // Filter to only show active locations
                setLocations(list.filter((loc) => loc.active));
            } catch (error) {
                console.error("Failed to load locations", error);
            }
        };
        fetchLocations();
    }, []);

    const form = useForm<EquipmentItemFormValues>({
        resolver: zodResolver(equipmentItemSchema),
        defaultValues: {
            equipment_id: initialData?.equipment_id ? String(initialData.equipment_id) : "",
            location_id: initialData?.location_id ? String(initialData.location_id) : "",
            size: initialData?.size || "",
            serial_no: initialData?.serial_no || "",
            inventory_code: initialData?.inventory_code || "",
            brand: initialData?.brand || "",
            color: initialData?.color || "",
            image_url: initialData?.image_url || "",
            status: initialData?.status || 'Available',
            purchase_date: initialData?.purchase_date ? initialData.purchase_date.split('T')[0] : "",
            requires_service: initialData?.requires_service || false,
            service_interval_days: initialData?.service_interval_days ? String(initialData.service_interval_days) : "",
            last_service_date: initialData?.last_service_date ? initialData.last_service_date.split('T')[0] : "",
            next_service_date: initialData?.next_service_date ? initialData.next_service_date.split('T')[0] : "",
        },
    });

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

    const selectedEquipmentId = form.watch('equipment_id');
    const requiresService = form.watch('requires_service');
    const serviceIntervalDays = form.watch('service_interval_days');
    const lastServiceDate = form.watch('last_service_date');
    const purchaseDate = form.watch('purchase_date');

    // Update available sizes and brands when equipment selection changes
    useEffect(() => {
        if (!selectedEquipmentId || equipment.length === 0) {
            setAvailableSizes([]);
            setAvailableBrands([]);
            if (!selectedEquipmentId) {
                form.setValue('size', '');
                form.setValue('brand', '');
            }
            return;
        }

        // Find equipment by comparing IDs (handle both string and number)
        const selectedEquipment = equipment.find((eq) => {
            return String(eq.id) === String(selectedEquipmentId) || eq.id === Number(selectedEquipmentId);
        });
        
        if (!selectedEquipment) {
            console.warn('Equipment not found for ID:', selectedEquipmentId, 'Available equipment:', equipment.map(e => ({ id: e.id, name: e.name })));
            setAvailableSizes([]);
            setAvailableBrands([]);
            return;
        }

        // Update available sizes - handle both array and null/undefined
        const sizes = selectedEquipment.sizes;
        if (sizes && Array.isArray(sizes) && sizes.length > 0) {
            setAvailableSizes(sizes);
        } else {
            setAvailableSizes([]);
        }
        
        // Update available brands - handle both array and null/undefined
        const brands = selectedEquipment.brands;
        if (brands && Array.isArray(brands) && brands.length > 0) {
            setAvailableBrands(brands);
        } else {
            setAvailableBrands([]);
        }
        
        // Clear size selection if current size is not in available sizes
        const currentSize = form.getValues('size');
        if (currentSize && (!sizes || !Array.isArray(sizes) || !sizes.includes(currentSize))) {
            form.setValue('size', '');
        }
        
        // Clear brand selection if current brand is not in available brands
        const currentBrand = form.getValues('brand');
        if (currentBrand && (!brands || !Array.isArray(brands) || !brands.includes(currentBrand))) {
            form.setValue('brand', '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEquipmentId, equipment]);

    // Auto-calculate next_service_date when relevant fields change
    useEffect(() => {
        // Only calculate if service is required and we have valid interval
        if (requiresService && serviceIntervalDays && parseInt(serviceIntervalDays) > 0) {
            const baseDate = lastServiceDate || purchaseDate;
            if (baseDate) {
                try {
                    // Always recalculate when interval or base date changes
                    const date = new Date(baseDate);
                    if (!isNaN(date.getTime())) {
                        date.setDate(date.getDate() + parseInt(serviceIntervalDays));
                        const calculatedDate = date.toISOString().split('T')[0];
                        
                        // Update the next_service_date field
                        form.setValue('next_service_date', calculatedDate, { shouldValidate: false });
                    }
                } catch (error) {
                    // Invalid date, skip calculation
                    console.error('Invalid date for calculation:', error);
                }
            } else {
                // Clear if no base date available
                form.setValue('next_service_date', '', { shouldValidate: false });
            }
        } else if (!requiresService) {
            // Clear next_service_date if service is disabled
            form.setValue('next_service_date', '', { shouldValidate: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requiresService, serviceIntervalDays, lastServiceDate, purchaseDate]);

    async function onSubmit(data: EquipmentItemFormValues) {
        setLoading(true);
        try {
            const payload: EquipmentItemFormData = {
                equipment_id: parseInt(data.equipment_id),
                location_id: data.location_id && data.location_id !== "" ? parseInt(data.location_id) : undefined,
                size: data.size && data.size !== "" ? data.size : undefined,
                serial_no: data.serial_no && data.serial_no !== "" ? data.serial_no : undefined,
                inventory_code: data.inventory_code && data.inventory_code !== "" ? data.inventory_code : undefined,
                brand: data.brand && data.brand !== "" ? data.brand : undefined,
                color: data.color && data.color !== "" ? data.color : undefined,
                image_url: data.image_url && data.image_url !== "" ? data.image_url : undefined,
                status: data.status,
                purchase_date: data.purchase_date && data.purchase_date !== "" ? data.purchase_date : undefined,
                requires_service: data.requires_service || false,
                service_interval_days: data.service_interval_days && data.service_interval_days !== "" ? parseInt(data.service_interval_days) : undefined,
                last_service_date: data.last_service_date && data.last_service_date !== "" ? data.last_service_date : undefined,
                next_service_date: data.next_service_date && data.next_service_date !== "" ? data.next_service_date : undefined,
            };

            if (equipmentItemId) {
                await equipmentItemService.update(Number(equipmentItemId), payload);
            } else {
                await equipmentItemService.create(payload);
            }
            router.push("/dashboard/equipment-items");
            router.refresh();
        } catch (error) {
            console.error("Failed to save equipment item", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* Equipment Item Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            Equipment Item Details
                        </CardTitle>
                        <CardDescription>
                            Basic information about the equipment item.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="equipment_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Equipment</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <div className="relative">
                                                    <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                    <SelectTrigger className="pl-9">
                                                        <SelectValue placeholder="Select equipment" />
                                                    </SelectTrigger>
                                                </div>
                                            </FormControl>
                                            <SelectContent>
                                                {equipment.map((eq) => (
                                                    <SelectItem key={eq.id} value={String(eq.id)}>
                                                        {eq.name} {eq.category ? `(${eq.category})` : ''}
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
                                name="location_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Location</FormLabel>
                                        <Select 
                                            onValueChange={(value) => field.onChange(value)} 
                                            value={field.value || undefined}
                                        >
                                            <FormControl>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                    <SelectTrigger className="pl-9">
                                                        <SelectValue placeholder="Select location (optional)" />
                                                    </SelectTrigger>
                                                </div>
                                            </FormControl>
                                            <SelectContent>
                                                {locations.map((loc) => (
                                                    <SelectItem key={loc.id} value={String(loc.id)}>
                                                        {loc.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="image_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Equipment Image</FormLabel>
                                    <FormControl>
                                        <EquipmentItemImageUpload
                                            value={field.value}
                                            onChange={field.onChange}
                                            onError={(error) => {
                                                console.error('Image upload error:', error);
                                                alert(error);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                                control={form.control}
                                name="size"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Size</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Ruler className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                <Select 
                                                    onValueChange={field.onChange} 
                                                    value={field.value || ""}
                                                    disabled={!selectedEquipmentId || availableSizes.length === 0}
                                                >
                                                    <SelectTrigger className="pl-9">
                                                        <SelectValue 
                                                            placeholder={
                                                                !selectedEquipmentId 
                                                                    ? "Select equipment first" 
                                                                    : availableSizes.length === 0 
                                                                    ? "No sizes available" 
                                                                    : "Select size"
                                                            } 
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableSizes.map((size) => (
                                                            <SelectItem key={size} value={size}>
                                                                {size}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </FormControl>
                                        {selectedEquipmentId && availableSizes.length === 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                No sizes configured for this equipment. Add sizes in the equipment settings.
                                            </p>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="brand"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Brand</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                <Select 
                                                    onValueChange={field.onChange} 
                                                    value={field.value || ""}
                                                    disabled={!selectedEquipmentId || availableBrands.length === 0}
                                                >
                                                    <SelectTrigger className="pl-9">
                                                        <SelectValue 
                                                            placeholder={
                                                                !selectedEquipmentId 
                                                                    ? "Select equipment first" 
                                                                    : availableBrands.length === 0 
                                                                    ? "No brands available" 
                                                                    : "Select brand"
                                                            } 
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableBrands.map((brand) => (
                                                            <SelectItem key={brand} value={brand}>
                                                                {brand}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </FormControl>
                                        {selectedEquipmentId && availableBrands.length === 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                No brands configured for this equipment. Add brands in the equipment settings.
                                            </p>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Color</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Palette className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="Color" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="inventory_code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Inventory Code</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Barcode className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="Inventory code" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="serial_no"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Serial Number</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="Serial number" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <div className="relative">
                                                <CheckCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                <SelectTrigger className="pl-9">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </div>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Available">Available</SelectItem>
                                            <SelectItem value="Rented">Rented</SelectItem>
                                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Service Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Wrench className="h-5 w-5 text-primary" />
                            Service Information
                        </CardTitle>
                        <CardDescription>
                            Track service intervals and maintenance schedules for this equipment item.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="purchase_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Purchase Date</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                            <DatePicker
                                                selected={parseDate(field.value)}
                                                onChange={(date) => field.onChange(formatDateToString(date))}
                                                dateFormat="PPP"
                                                placeholderText="Pick a date"
                                                wrapperClassName="w-full"
                                                maxDate={new Date()}
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
                            name="requires_service"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Requires Service</FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                            Check if this item needs regular servicing
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {requiresService && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="service_interval_days"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Service Interval (Days)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Calculator className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                        <Input 
                                                            type="number" 
                                                            placeholder="e.g. 90" 
                                                            className="pl-9" 
                                                            {...field}
                                                            min="1"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="last_service_date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Last Service Date</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                        <DatePicker
                                                            selected={parseDate(field.value)}
                                                            onChange={(date) => field.onChange(formatDateToString(date))}
                                                            dateFormat="PPP"
                                                            placeholderText="Pick a date"
                                                            wrapperClassName="w-full"
                                                            maxDate={new Date()}
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
                                </div>

                                <FormField
                                    control={form.control}
                                    name="next_service_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Next Service Date</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                    <DatePicker
                                                        selected={parseDate(field.value)}
                                                        onChange={(date) => field.onChange(formatDateToString(date))}
                                                        dateFormat="PPP"
                                                        placeholderText="Pick a date"
                                                        wrapperClassName="w-full"
                                                        minDate={new Date()}
                                                        className={cn(
                                                            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] pl-9",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    />
                                                </div>
                                            </FormControl>
                                            <p className="text-sm text-muted-foreground">
                                                Auto-calculated based on last service date + interval. You can override manually.
                                            </p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" size="lg" disabled={loading}>
                        {loading ? "Saving..." : (equipmentItemId ? "Update Equipment Item" : "Create Equipment Item")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

