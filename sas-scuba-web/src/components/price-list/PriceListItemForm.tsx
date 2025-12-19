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
import { Tag, DollarSign, Package, Info } from "lucide-react";

const priceListItemSchema = z.object({
    service_type: z.string().min(1, "Service type is required"),
    is_equipment_rental: z.boolean().optional(),
    equipment_item_id: z.number().optional(),
    name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
    description: z.string().optional(),
    price: z.number().min(0, "Price must be greater than or equal to 0"),
    unit: z.string().optional(),
    tax_percentage: z.number().min(0).max(100).optional(),
    sort_order: z.number().optional(),
    is_active: z.boolean().optional(),
});

interface PriceListItemFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: PriceListItem;
    baseCurrency?: string;
    onSuccess: () => void;
}

export function PriceListItemForm({ open, onOpenChange, initialData, baseCurrency, onSuccess }: PriceListItemFormProps) {
    const [loading, setLoading] = useState(false);
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [loadingServiceTypes, setLoadingServiceTypes] = useState(false);
    const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
    const [loadingEquipmentItems, setLoadingEquipmentItems] = useState(false);

    const form = useForm<PriceListItemFormData>({
        resolver: zodResolver(priceListItemSchema),
        defaultValues: {
            service_type: initialData?.service_type || "",
            is_equipment_rental: false,
            equipment_item_id: initialData?.equipment_item_id || undefined,
            name: initialData?.name || "",
            description: initialData?.description || "",
            price: initialData?.price || 0,
            unit: initialData?.unit || "",
            tax_percentage: initialData?.tax_percentage || undefined,
            sort_order: initialData?.sort_order || 0,
            is_active: initialData?.is_active ?? true,
        },
        values: open ? {
            service_type: initialData?.service_type || "",
            is_equipment_rental: !!initialData?.equipment_item_id,
            equipment_item_id: initialData?.equipment_item_id || undefined,
            name: initialData?.name || "",
            description: initialData?.description || "",
            price: initialData?.price || 0,
            unit: initialData?.unit || "",
            tax_percentage: initialData?.tax_percentage || undefined,
            sort_order: initialData?.sort_order || 0,
            is_active: initialData?.is_active ?? true,
        } : undefined,
    });

    const selectedServiceType = form.watch('service_type');
    const isEquipmentRental = form.watch('is_equipment_rental');
    const selectedEquipmentItemId = form.watch('equipment_item_id');

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
                    const data = await equipmentItemService.getAll(1, undefined, 'Available');
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
            const selectedItem = equipmentItems.find(item => item.id === selectedEquipmentItemId);
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
            const resetData = {
                service_type: initialData?.service_type || "",
                is_equipment_rental: !!initialData?.equipment_item_id,
                equipment_item_id: initialData?.equipment_item_id || undefined,
                name: initialData?.name || "",
                description: initialData?.description || "",
                price: initialData?.price || 0,
                unit: initialData?.unit || "",
                tax_percentage: initialData?.tax_percentage || undefined,
                sort_order: initialData?.sort_order || 0,
                is_active: initialData?.is_active ?? true,
            };
            form.reset(resetData);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    async function onSubmit(data: PriceListItemFormData) {
        setLoading(true);
        try {
            // If equipment rental is checked but service_type is not set, try to set it
            if (data.is_equipment_rental && !data.service_type && serviceTypes.length > 0) {
                const equipmentRentalType = serviceTypes.find(type => 
                    type.name.toLowerCase().includes('equipment') && 
                    type.name.toLowerCase().includes('rental')
                );
                if (equipmentRentalType) {
                    data.service_type = equipmentRentalType.name;
                } else {
                    // Fallback: try to find any service type with "rental" in the name
                    const rentalType = serviceTypes.find(type => 
                        type.name.toLowerCase().includes('rental')
                    );
                    if (rentalType) {
                        data.service_type = rentalType.name;
                    }
                }
            }
            
            // Remove is_equipment_rental from the data as it's only used for UI state
            const { is_equipment_rental, ...submitData } = data;
            
            // Ensure service_type is set
            if (!submitData.service_type) {
                alert("Please select a service type or ensure Equipment Rental service type exists in your database.");
                setLoading(false);
                return;
            }
            
            // Remove undefined values to avoid sending them to the backend
            const cleanedData: any = {};
            Object.keys(submitData).forEach(key => {
                const value = (submitData as any)[key];
                if (value !== undefined && value !== null && value !== '') {
                    cleanedData[key] = value;
                }
            });
            
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
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="e.g. per person" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
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

