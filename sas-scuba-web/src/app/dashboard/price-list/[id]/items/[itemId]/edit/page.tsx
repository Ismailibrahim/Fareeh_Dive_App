"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { priceListItemService } from "@/lib/api/services/price-list-item.service";
import { PriceListItem } from "@/lib/api/services/price-list.service";
import { priceListService } from "@/lib/api/services/price-list.service";
import { serviceTypeService, ServiceType } from "@/lib/api/services/service-type.service";
import { equipmentItemService, EquipmentItem } from "@/lib/api/services/equipment-item.service";
import { unitService, Unit } from "@/lib/api/services/unit.service";
import { Tag, DollarSign, Package, Calendar } from "lucide-react";
import { PriceTierManager } from "@/components/price-list/PriceTierManager";
import { DatePicker } from "@/components/ui/date-picker";

const schema = z.object({
    service_type: z.string().min(1, "Service type is required"),
    is_equipment_rental: z.boolean().optional(),
    equipment_item_id: z.number().optional(),
    name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
    description: z.string().optional(),
    price: z.number().min(0, "Price must be greater than or equal to 0"),
    base_price: z.number().min(0).optional(),
    pricing_model: z.enum(['SINGLE', 'RANGE', 'TIERED']).optional(),
    min_dives: z.number().min(1).optional(),
    max_dives: z.number().min(1).optional(),
    priority: z.number().optional(),
    valid_from: z.string().optional(),
    valid_until: z.string().optional(),
    applicable_to: z.enum(['ALL', 'MEMBER', 'NON_MEMBER', 'GROUP', 'CORPORATE']).optional(),
    unit: z.string().optional(),
    tax_percentage: z.number().min(0).max(100).optional(),
    tax_inclusive: z.boolean().optional(),
    service_charge_inclusive: z.boolean().optional(),
    sort_order: z.number().optional(),
    is_active: z.boolean().optional(),
}).refine((data) => {
    if (data.pricing_model === 'RANGE' || data.pricing_model === 'TIERED') {
        if (!data.min_dives || !data.max_dives) {
            return false;
        }
        return data.min_dives <= data.max_dives;
    }
    return true;
}, {
    message: "min_dives must be less than or equal to max_dives",
    path: ["max_dives"],
});

export default function EditPriceListItemPage() {
    const params = useParams();
    const router = useRouter();
    const priceListId = params.id as string;
    const itemId = params.itemId as string;
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [priceList, setPriceList] = useState<any>(null);
    const [item, setItem] = useState<PriceListItem | null>(null);
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            service_type: "",
            is_equipment_rental: false,
            equipment_item_id: undefined,
            name: "",
            description: "",
            price: 0,
            unit: undefined,
            tax_percentage: undefined,
            sort_order: 0,
            is_active: true,
        },
    });

    const isEquipmentRental = form.watch('is_equipment_rental');
    const selectedEquipmentItemId = form.watch('equipment_item_id');
    const pricingModel = form.watch('pricing_model') || 'SINGLE';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [priceListData, serviceTypesData, unitsData, itemData] = await Promise.all([
                    priceListService.getById(priceListId),
                    serviceTypeService.getAll(),
                    unitService.getAll(),
                    priceListItemService.getById(itemId),
                ]);
                setPriceList(priceListData);
                setServiceTypes(serviceTypesData);
                setUnits(unitsData);
                setItem(itemData);
                
                form.reset({
                    service_type: itemData.service_type || "",
                    is_equipment_rental: !!itemData.equipment_item_id,
                    equipment_item_id: itemData.equipment_item_id || undefined,
                    name: itemData.name || "",
                    description: itemData.description || "",
                    price: itemData.price || 0,
                    base_price: itemData.base_price || itemData.price || undefined,
                    pricing_model: itemData.pricing_model || 'SINGLE',
                    min_dives: itemData.min_dives || 1,
                    max_dives: itemData.max_dives || 1,
                    priority: itemData.priority || 0,
                    valid_from: itemData.valid_from || undefined,
                    valid_until: itemData.valid_until || undefined,
                    applicable_to: itemData.applicable_to || 'ALL',
                    unit: itemData.unit || undefined,
                    tax_percentage: itemData.tax_percentage || undefined,
                    tax_inclusive: itemData.tax_inclusive ?? false,
                    service_charge_inclusive: itemData.service_charge_inclusive ?? false,
                    sort_order: itemData.sort_order || 0,
                    is_active: itemData.is_active ?? true,
                });
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, [priceListId, itemId, form]);

    useEffect(() => {
        if (isEquipmentRental) {
            equipmentItemService.getAll({ page: 1, status: 'Available' }).then(data => {
                const itemsList = Array.isArray(data) ? data : (data as any).data || [];
                setEquipmentItems(itemsList);
            }).catch(console.error);
        } else {
            setEquipmentItems([]);
            if (!item?.equipment_item_id) {
                form.setValue('equipment_item_id', undefined);
            }
        }
    }, [isEquipmentRental, form, item]);

    useEffect(() => {
        if (selectedEquipmentItemId && equipmentItems.length > 0 && !item?.name) {
            const selectedItem = equipmentItems.find(item => item.id === selectedEquipmentItemId);
            if (selectedItem) {
                const displayName = selectedItem.equipment?.name 
                    ? `${selectedItem.equipment.name}${selectedItem.size ? ` - ${selectedItem.size}` : ''}${selectedItem.inventory_code ? ` (${selectedItem.inventory_code})` : ''}`
                    : `Equipment Item #${selectedItem.id}`;
                form.setValue('name', displayName);
            }
        }
    }, [selectedEquipmentItemId, equipmentItems, form, item]);

    useEffect(() => {
        if (isEquipmentRental && serviceTypes.length > 0) {
            const equipmentRentalType = serviceTypes.find(type => 
                type.name.toLowerCase().includes('equipment') && 
                type.name.toLowerCase().includes('rental')
            ) || serviceTypes.find(type => type.name.toLowerCase().includes('rental'));
            if (equipmentRentalType) {
                form.setValue('service_type', equipmentRentalType.name);
            }
        }
    }, [isEquipmentRental, serviceTypes, form]);

    async function onSubmit(data: z.infer<typeof schema>) {
        setLoading(true);
        try {
            if (data.is_equipment_rental && !data.service_type && serviceTypes.length > 0) {
                const equipmentRentalType = serviceTypes.find(type => 
                    type.name.toLowerCase().includes('equipment') && 
                    type.name.toLowerCase().includes('rental')
                ) || serviceTypes.find(type => type.name.toLowerCase().includes('rental'));
                if (equipmentRentalType) {
                    data.service_type = equipmentRentalType.name;
                }
            }
            
            const { is_equipment_rental, ...submitData } = data;
            
            // Set base_price from price if not provided
            if (!submitData.base_price && submitData.price) {
                submitData.base_price = submitData.price;
            }
            
            // Set default values for pricing fields if not provided
            if (!submitData.pricing_model) {
                submitData.pricing_model = 'SINGLE';
            }
            if (!submitData.min_dives) {
                submitData.min_dives = 1;
            }
            if (!submitData.max_dives) {
                submitData.max_dives = 1;
            }
            if (submitData.priority === undefined) {
                submitData.priority = 0;
            }
            if (!submitData.applicable_to) {
                submitData.applicable_to = 'ALL';
            }
            
            if (!submitData.service_type) {
                alert("Please select a service type.");
                setLoading(false);
                return;
            }
            
            const cleanedData: any = {};
            Object.keys(submitData).forEach(key => {
                const value = (submitData as any)[key];
                if (value !== undefined && value !== null && value !== '') {
                    cleanedData[key] = value;
                }
            });
            
            await priceListItemService.update(parseInt(itemId, 10), cleanedData);
            router.push(`/dashboard/price-list/${priceListId}/edit`);
        } catch (error: any) {
            console.error("Failed to save", error);
            alert(error.response?.data?.message || "Failed to update price list item.");
        } finally {
            setLoading(false);
        }
    }

    if (loadingData) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Price List Item" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Edit Price List Item" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/price-list/${priceListId}/edit`}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Edit Price List Item</h2>
                        <p className="text-muted-foreground">Update the price list item details.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Item Details</CardTitle>
                            <CardDescription>Update the details below to modify this price list item.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                                        disabled={isEquipmentRental}
                                                    >
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                                <SelectTrigger className="pl-9">
                                                                    <SelectValue placeholder={isEquipmentRental ? "Equipment Rental" : "Select service type"} />
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
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="cursor-pointer mb-0">Equipment Rentals</FormLabel>
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
                                                    >
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                                <SelectTrigger className="pl-9">
                                                                    <SelectValue placeholder="Select equipment item" />
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
                                                    <Textarea placeholder="Detailed description..." className="min-h-[80px]" {...field} />
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
                                                    <FormLabel>Price {priceList?.base_currency && `(${priceList.base_currency})`}</FormLabel>
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
                                                    <Select 
                                                        onValueChange={(value) => field.onChange(value || undefined)} 
                                                        value={field.value || ""}
                                                    >
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                                <SelectTrigger className="pl-9">
                                                                    <SelectValue placeholder="Select unit" />
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

                                    {/* Dive Pricing Configuration */}
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

                                        {/* Tier Manager for TIERED pricing */}
                                        {pricingModel === 'TIERED' && item && (
                                            <div className="mt-4">
                                                <PriceTierManager itemId={item.id} pricingModel={pricingModel} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="tax_inclusive"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel className="cursor-pointer">
                                                            Tax Inclusive
                                                        </FormLabel>
                                                        <p className="text-sm text-muted-foreground">
                                                            Tax is included in the price
                                                        </p>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="service_charge_inclusive"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel className="cursor-pointer">
                                                            Service Charge Inclusive
                                                        </FormLabel>
                                                        <p className="text-sm text-muted-foreground">
                                                            Service charge is included in the price
                                                        </p>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-4">
                                        <Link href={`/dashboard/price-list/${priceListId}/edit`}>
                                            <Button type="button" variant="outline">Cancel</Button>
                                        </Link>
                                        <Button type="submit" disabled={loading}>
                                            {loading ? "Saving..." : "Update Item"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

