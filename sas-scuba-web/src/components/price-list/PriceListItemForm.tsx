"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PriceListItem, PriceListItemFormData } from "@/lib/api/services/price-list.service";
import { priceListItemService } from "@/lib/api/services/price-list-item.service";
import { serviceTypeService, ServiceType } from "@/lib/api/services/service-type.service";
import { equipmentItemService, EquipmentItem } from "@/lib/api/services/equipment-item.service";
import { unitService, Unit } from "@/lib/api/services/unit.service";
import { Tag, DollarSign, Package, Info, Calendar } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

const priceListItemSchema = z.object({
    service_type: z.string().min(1, "Service type is required"),
    is_equipment_rental: z.boolean().optional(),
    equipment_item_id: z.string().optional().or(z.literal("")),
    name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
    description: z.string().optional(),
    price: z.string().min(1, "Price is required"),
    base_price: z.string().optional(),
    pricing_model: z.enum(['SINGLE', 'RANGE', 'TIERED']).optional(),
    min_dives: z.string().optional(),
    max_dives: z.string().optional(),
    priority: z.string().optional(),
    valid_from: z.string().optional(),
    valid_until: z.string().optional(),
    applicable_to: z.enum(['ALL', 'MEMBER', 'NON_MEMBER', 'GROUP', 'CORPORATE']).optional(),
    unit: z.string().optional(),
    tax_percentage: z.string().optional(),
    sort_order: z.string().optional(),
    is_active: z.boolean().optional(),
}).refine((data) => {
    if (data.pricing_model === 'RANGE' || data.pricing_model === 'TIERED') {
        const minDives = data.min_dives ? parseInt(data.min_dives) : undefined;
        const maxDives = data.max_dives ? parseInt(data.max_dives) : undefined;
        if (!minDives || !maxDives) {
            return false;
        }
        return minDives <= maxDives;
    }
    return true;
}, {
    message: "min_dives must be less than or equal to max_dives",
    path: ["max_dives"],
});

// Form values type (matches schema)
type PriceListItemFormValues = z.infer<typeof priceListItemSchema>;

interface PriceListItemFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: PriceListItem;
    baseCurrency?: string;
    priceListId?: string | number;
    onSuccess: () => void;
}

export function PriceListItemForm({ open, onOpenChange, initialData, baseCurrency, priceListId, onSuccess }: PriceListItemFormProps) {
    const [loading, setLoading] = useState(false);
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [loadingServiceTypes, setLoadingServiceTypes] = useState(false);
    const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
    const [loadingEquipmentItems, setLoadingEquipmentItems] = useState(false);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loadingUnits, setLoadingUnits] = useState(false);

    const form = useForm<PriceListItemFormValues>({
        resolver: zodResolver(priceListItemSchema),
        defaultValues: {
            service_type: initialData?.service_type || "",
            is_equipment_rental: false,
            equipment_item_id: initialData?.equipment_item_id ? String(initialData.equipment_item_id) : "",
            name: initialData?.name || "",
            description: initialData?.description || "",
            price: initialData?.price ? String(initialData.price) : "0",
            base_price: initialData?.base_price ? String(initialData.base_price) : (initialData?.price ? String(initialData.price) : ""),
            pricing_model: initialData?.pricing_model || 'SINGLE',
            min_dives: initialData?.min_dives ? String(initialData.min_dives) : "1",
            max_dives: initialData?.max_dives ? String(initialData.max_dives) : "1",
            priority: initialData?.priority ? String(initialData.priority) : "0",
            valid_from: initialData?.valid_from || undefined,
            valid_until: initialData?.valid_until || undefined,
            applicable_to: initialData?.applicable_to || 'ALL',
            unit: initialData?.unit || undefined,
            tax_percentage: initialData?.tax_percentage ? String(initialData.tax_percentage) : "",
            sort_order: initialData?.sort_order ? String(initialData.sort_order) : "0",
            is_active: initialData?.is_active ?? true,
        },
        values: open ? {
            service_type: initialData?.service_type || "",
            is_equipment_rental: !!initialData?.equipment_item_id,
            equipment_item_id: initialData?.equipment_item_id ? String(initialData.equipment_item_id) : "",
            name: initialData?.name || "",
            description: initialData?.description || "",
            price: initialData?.price ? String(initialData.price) : "0",
            base_price: initialData?.base_price ? String(initialData.base_price) : (initialData?.price ? String(initialData.price) : ""),
            pricing_model: initialData?.pricing_model || 'SINGLE',
            min_dives: initialData?.min_dives ? String(initialData.min_dives) : "1",
            max_dives: initialData?.max_dives ? String(initialData.max_dives) : "1",
            priority: initialData?.priority ? String(initialData.priority) : "0",
            valid_from: initialData?.valid_from || undefined,
            valid_until: initialData?.valid_until || undefined,
            applicable_to: initialData?.applicable_to || 'ALL',
            unit: initialData?.unit || undefined,
            tax_percentage: initialData?.tax_percentage ? String(initialData.tax_percentage) : "",
            sort_order: initialData?.sort_order ? String(initialData.sort_order) : "0",
            is_active: initialData?.is_active ?? true,
        } : undefined,
    });

    const selectedServiceType = form.watch('service_type');
    const isEquipmentRental = form.watch('is_equipment_rental');
    const selectedEquipmentItemId = form.watch('equipment_item_id');
    const pricingModel = form.watch('pricing_model') || 'SINGLE';

    useEffect(() => {
        const fetchServiceTypes = async () => {
            try {
                setLoadingServiceTypes(true);
                const data = await serviceTypeService.getAll();
                setServiceTypes(data);
            } catch (error) {
                console.error("Failed to load service types", error);
            } finally {
                setLoadingServiceTypes(false);
            }
        };
        fetchServiceTypes();
    }, []);

    useEffect(() => {
        const fetchUnits = async () => {
            if (!open) return;
            try {
                setLoadingUnits(true);
                const data = await unitService.getAll();
                setUnits(data);
            } catch (error) {
                console.error("Failed to load units", error);
            } finally {
                setLoadingUnits(false);
            }
        };
        fetchUnits();
    }, [open]);

    // Set service type when checkbox is checked or when service types load
    useEffect(() => {
        if (!open || !isEquipmentRental || serviceTypes.length === 0) return;
        
        const equipmentRentalType = serviceTypes.find(type => 
            type.name.toLowerCase().includes('equipment') && 
            type.name.toLowerCase().includes('rental')
        );
        if (equipmentRentalType) {
            const currentServiceType = form.getValues('service_type');
            if (currentServiceType !== equipmentRentalType.name) {
                form.setValue('service_type', equipmentRentalType.name, { shouldValidate: true });
            }
        } else {
            // Fallback: try to find any service type with "rental" in the name
            const rentalType = serviceTypes.find(type => 
                type.name.toLowerCase().includes('rental')
            );
            if (rentalType) {
                const currentServiceType = form.getValues('service_type');
                if (currentServiceType !== rentalType.name) {
                    form.setValue('service_type', rentalType.name, { shouldValidate: true });
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEquipmentRental, serviceTypes.length, open]);

    useEffect(() => {
        if (!open) return;
        
        const fetchEquipmentItems = async () => {
            // Only fetch if checkbox is checked
            if (isEquipmentRental) {
                try {
                    setLoadingEquipmentItems(true);
                    const data = await equipmentItemService.getAll({ page: 1, status: 'Available' });
                    const itemsList = Array.isArray(data) ? data : (data as any).data || [];
                    setEquipmentItems(itemsList);
                } catch (error) {
                    console.error("Failed to load equipment items", error);
                } finally {
                    setLoadingEquipmentItems(false);
                }
            } else {
                setEquipmentItems([]);
                // Clear equipment_item_id when checkbox is unchecked
                form.setValue('equipment_item_id', undefined);
            }
        };
        fetchEquipmentItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEquipmentRental]);

    // Auto-populate name when equipment item is selected
    useEffect(() => {
        if (selectedEquipmentItemId && equipmentItems.length > 0) {
            const selectedItem = equipmentItems.find(item => item.id === parseInt(selectedEquipmentItemId));
            if (selectedItem) {
                const displayName = selectedItem.equipment?.name 
                    ? `${selectedItem.equipment.name}${selectedItem.size ? ` - ${selectedItem.size}` : ''}${selectedItem.inventory_code ? ` (${selectedItem.inventory_code})` : ''}`
                    : `Equipment Item #${selectedItem.id}`;
                form.setValue('name', displayName);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEquipmentItemId]);

    useEffect(() => {
        if (open) {
            const resetData: PriceListItemFormValues = {
                service_type: initialData?.service_type || "",
                is_equipment_rental: !!initialData?.equipment_item_id,
                equipment_item_id: initialData?.equipment_item_id ? String(initialData.equipment_item_id) : "",
                name: initialData?.name || "",
                description: initialData?.description || "",
                price: initialData?.price ? String(initialData.price) : "0",
                base_price: initialData?.base_price ? String(initialData.base_price) : (initialData?.price ? String(initialData.price) : ""),
                pricing_model: initialData?.pricing_model || 'SINGLE',
                min_dives: initialData?.min_dives ? String(initialData.min_dives) : "1",
                max_dives: initialData?.max_dives ? String(initialData.max_dives) : "1",
                priority: initialData?.priority ? String(initialData.priority) : "0",
                valid_from: initialData?.valid_from || undefined,
                valid_until: initialData?.valid_until || undefined,
                applicable_to: initialData?.applicable_to || 'ALL',
                unit: initialData?.unit || undefined,
                tax_percentage: initialData?.tax_percentage ? String(initialData.tax_percentage) : "",
                sort_order: initialData?.sort_order ? String(initialData.sort_order) : "0",
                is_active: initialData?.is_active ?? true,
            };
            form.reset(resetData);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Ensure unit value is set after units are loaded (this ensures Select component recognizes the value)
    useEffect(() => {
        if (open && initialData?.unit && units.length > 0 && !loadingUnits) {
            // Verify that the stored unit exists in the units list
            const unitValue = initialData.unit;
            const unitExists = units.some(u => u.name === unitValue);
            if (unitExists) {
                // Always set the value to ensure Select component recognizes it
                // This is needed because the form might have been reset before units loaded
                form.setValue('unit', unitValue, { shouldValidate: false });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, units.length, loadingUnits, initialData]);

    async function onSubmit(data: PriceListItemFormValues) {
        setLoading(true);
        try {
            // Transform form data to API format
            let serviceType = data.service_type;
            
            // If equipment rental is checked but service_type is not set, try to set it
            if (data.is_equipment_rental && !serviceType && serviceTypes.length > 0) {
                const equipmentRentalType = serviceTypes.find(type => 
                    type.name.toLowerCase().includes('equipment') && 
                    type.name.toLowerCase().includes('rental')
                );
                if (equipmentRentalType) {
                    serviceType = equipmentRentalType.name;
                } else {
                    // Fallback: try to find any service type with "rental" in the name
                    const rentalType = serviceTypes.find(type => 
                        type.name.toLowerCase().includes('rental')
                    );
                    if (rentalType) {
                        serviceType = rentalType.name;
                    }
                }
            }
            
            // Ensure service_type is set
            if (!serviceType) {
                alert("Please select a service type or ensure Equipment Rental service type exists in your database.");
                setLoading(false);
                return;
            }
            
            const payload: PriceListItemFormData = {
                service_type: serviceType,
                equipment_item_id: data.equipment_item_id && data.equipment_item_id !== "" ? parseInt(data.equipment_item_id) : undefined,
                name: data.name,
                description: data.description && data.description !== "" ? data.description : undefined,
                price: parseFloat(data.price) || 0,
                base_price: data.base_price && data.base_price !== "" ? parseFloat(data.base_price) : (parseFloat(data.price) || 0),
                pricing_model: data.pricing_model || 'SINGLE',
                min_dives: data.min_dives && data.min_dives !== "" ? parseInt(data.min_dives) : 1,
                max_dives: data.max_dives && data.max_dives !== "" ? parseInt(data.max_dives) : 1,
                priority: data.priority && data.priority !== "" ? parseInt(data.priority) : 0,
                valid_from: data.valid_from && data.valid_from !== "" ? data.valid_from : undefined,
                valid_until: data.valid_until && data.valid_until !== "" ? data.valid_until : undefined,
                applicable_to: data.applicable_to || 'ALL',
                unit: data.unit && data.unit !== "" ? data.unit : undefined,
                tax_percentage: data.tax_percentage && data.tax_percentage !== "" ? parseFloat(data.tax_percentage) : undefined,
                sort_order: data.sort_order && data.sort_order !== "" ? parseInt(data.sort_order) : 0,
                is_active: data.is_active ?? true,
            };
            
            // Remove undefined values to avoid sending them to the backend
            const cleanedData: any = {};
            Object.keys(payload).forEach(key => {
                const value = (payload as any)[key];
                if (value !== undefined && value !== null && value !== '') {
                    cleanedData[key] = value;
                }
            });
            
            // Include price_list_id when creating a new item
            if (!initialData?.id && priceListId) {
                cleanedData.price_list_id = typeof priceListId === 'string' ? parseInt(priceListId, 10) : priceListId;
            }
            
            if (initialData?.id) {
                await priceListItemService.update(initialData.id, cleanedData);
            } else {
                await priceListItemService.create(cleanedData);
            }
            onOpenChange(false);
            form.reset();
            onSuccess();
        } catch (error: any) {
            console.error("Failed to save price list item", error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to save price list item. Please check if the database migration has been run.";
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Price List Item" : "Add Price List Item"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "Update the price list item details." : "Add a new item to your price list."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="flex items-end gap-4">
                            <FormField
                                control={form.control}
                                name="service_type"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Service Type</FormLabel>
                                        <Select 
                                            onValueChange={field.onChange} 
                                            value={field.value || ""} 
                                            disabled={loadingServiceTypes || isEquipmentRental}
                                        >
                                            <FormControl>
                                                <div className="relative">
                                                    <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                    <SelectTrigger className="pl-9">
                                                        <SelectValue placeholder={loadingServiceTypes ? "Loading..." : isEquipmentRental ? "Equipment Rental" : "Select service type"} />
                                                    </SelectTrigger>
                                                </div>
                                            </FormControl>
                                            <SelectContent>
                                                {serviceTypes.map((type) => (
                                                    <SelectItem key={type.id} value={type.name}>
                                                        {type.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {isEquipmentRental && (
                                            <p className="text-sm text-muted-foreground">Service type is automatically set to Equipment Rental</p>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="is_equipment_rental"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 pb-2">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={(checked) => {
                                                    field.onChange(checked);
                                                    // Immediately set service type when checkbox is checked
                                                    if (checked && serviceTypes.length > 0) {
                                                        const equipmentRentalType = serviceTypes.find(type => 
                                                            type.name.toLowerCase().includes('equipment') && 
                                                            type.name.toLowerCase().includes('rental')
                                                        );
                                                        if (equipmentRentalType) {
                                                            form.setValue('service_type', equipmentRentalType.name, { shouldValidate: true });
                                                        } else {
                                                            // Fallback: try to find any service type with "rental" in the name
                                                            const rentalType = serviceTypes.find(type => 
                                                                type.name.toLowerCase().includes('rental')
                                                            );
                                                            if (rentalType) {
                                                                form.setValue('service_type', rentalType.name, { shouldValidate: true });
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="cursor-pointer mb-0">
                                                Equipment Rentals
                                            </FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                        {isEquipmentRental && (
                            <FormField
                                control={form.control}
                                name="equipment_item_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Equipment Item</FormLabel>
                                        <Select 
                                            onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                                            value={field.value ? String(field.value) : ""}
                                            disabled={loadingEquipmentItems}
                                        >
                                            <FormControl>
                                                <div className="relative">
                                                    <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                    <SelectTrigger className="pl-9">
                                                        <SelectValue placeholder={loadingEquipmentItems ? "Loading..." : "Select equipment item"} />
                                                    </SelectTrigger>
                                                </div>
                                            </FormControl>
                                            <SelectContent>
                                                {equipmentItems.map((item) => {
                                                    const displayName = item.equipment?.name 
                                                        ? `${item.equipment.name}${item.size ? ` - ${item.size}` : ''}${item.inventory_code ? ` (${item.inventory_code})` : ''}`
                                                        : `Item #${item.id}`;
                                                    return (
                                                        <SelectItem key={item.id} value={String(item.id)}>
                                                            {displayName}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Open Water Diver Course" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detailed description of the service..."
                                            className="min-h-[80px]"
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
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price {baseCurrency && `(${baseCurrency})`}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0.00"
                                                    className="pl-9"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="unit"
                                render={({ field }) => {
                                    // Ensure value is a string if it exists, or undefined if not
                                    const selectValue = field.value && typeof field.value === 'string' ? field.value : undefined;
                                    return (
                                        <FormItem>
                                            <FormLabel>Unit</FormLabel>
                                            <Select 
                                                onValueChange={(value) => field.onChange(value || undefined)} 
                                                value={selectValue}
                                                disabled={loadingUnits}
                                            >
                                                <FormControl>
                                                    <div className="relative">
                                                        <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                        <SelectTrigger className="pl-9">
                                                            <SelectValue placeholder={loadingUnits ? "Loading..." : "Select unit"} />
                                                        </SelectTrigger>
                                                    </div>
                                                </FormControl>
                                                <SelectContent>
                                                    {units.map((unit) => (
                                                        <SelectItem key={unit.id} value={unit.name}>
                                                            {unit.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="tax_percentage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tax Percentage (%)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            placeholder="0.00"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        {/* Dive Pricing Fields */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-sm font-medium">Dive Pricing Configuration</h3>
                            
                            <FormField
                                control={form.control}
                                name="pricing_model"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pricing Model</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || 'SINGLE'}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select pricing model" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="SINGLE">Single Price</SelectItem>
                                                <SelectItem value="RANGE">Range-Based (by dive count)</SelectItem>
                                                <SelectItem value="TIERED">Tiered Pricing</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            {(pricingModel === 'RANGE' || pricingModel === 'TIERED') && (
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="min_dives"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Min Dives</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        placeholder="1"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                                        value={field.value || 1}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="max_dives"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Max Dives</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        placeholder="1"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                                        value={field.value || 1}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4 items-start">
                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Priority</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                    value={field.value || 0}
                                                />
                                            </FormControl>
                                            <p className="text-xs text-muted-foreground">Higher number = higher priority</p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="applicable_to"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Applicable To</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || 'ALL'}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select customer type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="ALL">All Customers</SelectItem>
                                                    <SelectItem value="MEMBER">Members Only</SelectItem>
                                                    <SelectItem value="NON_MEMBER">Non-Members Only</SelectItem>
                                                    <SelectItem value="GROUP">Groups Only</SelectItem>
                                                    <SelectItem value="CORPORATE">Corporate Only</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="valid_from"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Valid From</FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Select start date"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="valid_until"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Valid Until</FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Select end date"
                                                    minDate={form.watch('valid_from')}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : (initialData ? "Update" : "Add")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

