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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Package, PackageFormData, PackageComponent, PackageOption, PackagePricingTier } from "@/lib/api/services/package.service";
import { packageService } from "@/lib/api/services/package.service";
import { priceListItemService } from "@/lib/api/services/price-list-item.service";
import { PriceListItem } from "@/lib/api/services/price-list.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Trash2, Package as PackageIcon, List, Tag, DollarSign } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

const componentSchema = z.object({
    component_type: z.enum(['TRANSFER', 'ACCOMMODATION', 'DIVE', 'EXCURSION', 'MEAL', 'EQUIPMENT', 'OTHER']),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    item_id: z.string().optional().or(z.literal("")),
    unit_price: z.string().min(1, "Unit price is required"),
    quantity: z.string().min(1, "Quantity is required"),
    unit: z.string().optional(),
    is_inclusive: z.boolean().optional(),
    sort_order: z.string().optional(),
});

const optionSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    item_id: z.string().optional().or(z.literal("")),
    price: z.string().min(1, "Price is required"),
    unit: z.string().optional(),
    is_active: z.boolean().optional(),
    max_quantity: z.string().optional(),
    sort_order: z.string().optional(),
});

const tierSchema = z.object({
    min_persons: z.string().min(1, "Minimum persons is required"),
    max_persons: z.string().optional(),
    price_per_person: z.string().min(1, "Price per person is required"),
    discount_percentage: z.string().optional(),
    is_active: z.boolean().optional(),
});

const packageSchema = z.object({
    package_code: z.string().min(1, "Package code is required").max(50),
    name: z.string().min(1, "Name is required").max(255),
    description: z.string().optional(),
    nights: z.string().optional(),
    days: z.string().optional(),
    total_dives: z.string().optional(),
    base_price: z.string().min(1, "Base price is required"),
    price_per_person: z.string().min(1, "Price per person is required"),
    currency: z.string().max(3).optional(),
    is_active: z.boolean().optional(),
    sort_order: z.string().optional(),
    valid_from: z.string().optional(),
    valid_until: z.string().optional(),
    components: z.array(componentSchema).optional(),
    options: z.array(optionSchema).optional(),
    pricing_tiers: z.array(tierSchema).optional(),
});

// Form values type (matches schema)
type PackageFormValues = z.infer<typeof packageSchema>;

interface PackageFormProps {
    initialData?: Package;
    packageId?: string | number;
}

export function PackageForm({ initialData, packageId }: PackageFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'basic' | 'components' | 'options' | 'tiers'>('basic');
    const [priceListItems, setPriceListItems] = useState<PriceListItem[]>([]);

    useEffect(() => {
        const fetchPriceListItems = async () => {
            try {
                const data = await priceListItemService.getAll({ is_active: true });
                setPriceListItems(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to fetch price list items", error);
            }
        };
        fetchPriceListItems();
    }, []);

    const form = useForm<PackageFormValues>({
        resolver: zodResolver(packageSchema),
        defaultValues: {
            package_code: initialData?.package_code || '',
            name: initialData?.name || '',
            description: initialData?.description || '',
            nights: initialData?.nights ? String(initialData.nights) : '',
            days: initialData?.days ? String(initialData.days) : '',
            total_dives: initialData?.total_dives ? String(initialData.total_dives) : '',
            base_price: initialData?.base_price ? String(initialData.base_price) : '0',
            price_per_person: initialData?.price_per_person ? String(initialData.price_per_person) : '0',
            currency: initialData?.currency || 'USD',
            is_active: initialData?.is_active ?? true,
            sort_order: initialData?.sort_order ? String(initialData.sort_order) : '',
            valid_from: initialData?.valid_from || '',
            valid_until: initialData?.valid_until || '',
            components: initialData?.components?.map(c => ({
                component_type: c.component_type,
                name: c.name,
                description: c.description || '',
                item_id: c.item_id ? String(c.item_id) : '',
                unit_price: String(c.unit_price),
                quantity: String(c.quantity),
                unit: c.unit || '',
                is_inclusive: c.is_inclusive,
                sort_order: c.sort_order ? String(c.sort_order) : '',
            })) || [],
            options: initialData?.options?.map(o => ({
                name: o.name,
                description: o.description || '',
                item_id: o.item_id ? String(o.item_id) : '',
                price: String(o.price),
                unit: o.unit || '',
                is_active: o.is_active,
                max_quantity: o.max_quantity ? String(o.max_quantity) : '',
                sort_order: o.sort_order ? String(o.sort_order) : '',
            })) || [],
            pricing_tiers: initialData?.pricing_tiers?.map(t => ({
                min_persons: String(t.min_persons),
                max_persons: t.max_persons ? String(t.max_persons) : '',
                price_per_person: String(t.price_per_person),
                discount_percentage: t.discount_percentage ? String(t.discount_percentage) : '',
                is_active: t.is_active,
            })) || [],
        },
    });

    const { fields: componentFields, append: appendComponent, remove: removeComponent } = useFieldArray({
        control: form.control,
        name: 'components',
    });

    const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
        control: form.control,
        name: 'options',
    });

    const { fields: tierFields, append: appendTier, remove: removeTier } = useFieldArray({
        control: form.control,
        name: 'pricing_tiers',
    });

    async function onSubmit(data: PackageFormValues) {
        setLoading(true);
        try {
            // Transform form data to API format (convert strings to numbers)
            const payload: PackageFormData = {
                package_code: data.package_code,
                name: data.name,
                description: data.description || undefined,
                nights: data.nights ? parseInt(data.nights) : undefined,
                days: data.days ? parseInt(data.days) : undefined,
                total_dives: data.total_dives ? parseInt(data.total_dives) : undefined,
                base_price: parseFloat(data.base_price) || 0,
                price_per_person: parseFloat(data.price_per_person) || 0,
                currency: data.currency || undefined,
                is_active: data.is_active,
                sort_order: data.sort_order ? parseInt(data.sort_order) : undefined,
                valid_from: data.valid_from || undefined,
                valid_until: data.valid_until || undefined,
                components: data.components?.map(c => ({
                    component_type: c.component_type,
                    name: c.name,
                    description: c.description || undefined,
                    item_id: c.item_id && c.item_id !== "" ? parseInt(c.item_id) : undefined,
                    unit_price: parseFloat(c.unit_price) || 0,
                    quantity: parseInt(c.quantity) || 1,
                    unit: c.unit || "",
                    total_price: (parseFloat(c.unit_price) || 0) * (parseInt(c.quantity) || 1),
                    is_inclusive: c.is_inclusive ?? false,
                    sort_order: c.sort_order ? parseInt(c.sort_order) : 0,
                })),
                options: data.options?.map(o => ({
                    name: o.name,
                    description: o.description || undefined,
                    item_id: o.item_id && o.item_id !== "" ? parseInt(o.item_id) : undefined,
                    price: parseFloat(o.price) || 0,
                    unit: o.unit || undefined,
                    is_active: o.is_active ?? true,
                    max_quantity: o.max_quantity ? parseInt(o.max_quantity) : undefined,
                    sort_order: o.sort_order ? parseInt(o.sort_order) : 0,
                })),
                pricing_tiers: data.pricing_tiers?.map(t => ({
                    min_persons: parseInt(t.min_persons) || 1,
                    max_persons: t.max_persons ? parseInt(t.max_persons) : undefined,
                    price_per_person: parseFloat(t.price_per_person) || 0,
                    discount_percentage: t.discount_percentage ? parseFloat(t.discount_percentage) : 0,
                    is_active: t.is_active ?? true,
                })),
            };
            
            if (initialData && packageId) {
                await packageService.update(Number(packageId), payload);
            } else {
                await packageService.create(payload);
            }
            router.push('/dashboard/packages');
        } catch (error: any) {
            console.error("Failed to save package", error);
            alert(error.response?.data?.message || "Failed to save package");
        } finally {
            setLoading(false);
        }
    }

    const tabs = [
        { id: 'basic', label: 'Basic Info', icon: PackageIcon },
        { id: 'components', label: 'Components', icon: List },
        { id: 'options', label: 'Options', icon: Tag },
        { id: 'tiers', label: 'Pricing Tiers', icon: DollarSign },
    ];

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="border-b">
                <nav className="flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                                    ${activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                                    }
                                `}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Info Tab */}
                    {activeTab === 'basic' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>Enter the basic details for this package</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="package_code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Package Code</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="PKG-7N8D-14D" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Package Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="7 Nights 8 Days 14 Dives" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} placeholder="Package description..." />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="nights"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nights</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="days"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Days</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="total_dives"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Total Dives</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="base_price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Base Price</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="price_per_person"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Price Per Person</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="currency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Currency</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="USD" maxLength={3} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="valid_from"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Valid From</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
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
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <FormField
                                        control={form.control}
                                        name="is_active"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>Active</FormLabel>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="sort_order"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Sort Order</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} className="w-24" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Components Tab */}
                    {activeTab === 'components' && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Package Components</CardTitle>
                                        <CardDescription>Define the breakdown items included in this package</CardDescription>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => appendComponent({
                                            component_type: 'OTHER',
                                            name: '',
                                            description: '',
                                            item_id: '',
                                            unit_price: '0',
                                            quantity: '1',
                                            unit: 'unit',
                                            is_inclusive: true,
                                            sort_order: String(componentFields.length),
                                        })}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Component
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {componentFields.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No components added. Click "Add Component" to get started.
                                    </div>
                                ) : (
                                    componentFields.map((field, index) => (
                                        <Card key={field.id}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <h4 className="font-medium">Component {index + 1}</h4>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeComponent(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`components.${index}.component_type`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Type</FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select type" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="TRANSFER">Transfer</SelectItem>
                                                                        <SelectItem value="ACCOMMODATION">Accommodation</SelectItem>
                                                                        <SelectItem value="DIVE">Dive</SelectItem>
                                                                        <SelectItem value="EXCURSION">Excursion</SelectItem>
                                                                        <SelectItem value="MEAL">Meal</SelectItem>
                                                                        <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                                                                        <SelectItem value="OTHER">Other</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`components.${index}.name`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Name</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} placeholder="Component name" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`components.${index}.description`}
                                                        render={({ field }) => (
                                                            <FormItem className="md:col-span-2">
                                                                <FormLabel>Description</FormLabel>
                                                                <FormControl>
                                                                    <Textarea {...field} placeholder="Component description" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`components.${index}.unit_price`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Unit Price</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`components.${index}.quantity`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Quantity</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`components.${index}.unit`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Unit</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} placeholder="unit, night, dive, etc." />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`components.${index}.is_inclusive`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                    />
                                                                </FormControl>
                                                                <div className="space-y-1 leading-none">
                                                                    <FormLabel>Included in Package</FormLabel>
                                                                </div>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Options Tab */}
                    {activeTab === 'options' && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Package Options</CardTitle>
                                        <CardDescription>Optional add-ons that customers can purchase</CardDescription>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => appendOption({
                                            name: '',
                                            description: '',
                                            item_id: '',
                                            price: '0',
                                            unit: '',
                                            is_active: true,
                                            max_quantity: '',
                                            sort_order: String(optionFields.length),
                                        })}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Option
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {optionFields.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No options added. Click "Add Option" to get started.
                                    </div>
                                ) : (
                                    optionFields.map((field, index) => (
                                        <Card key={field.id}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <h4 className="font-medium">Option {index + 1}</h4>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeOption(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`options.${index}.name`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Name</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} placeholder="Option name" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`options.${index}.price`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Price</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`options.${index}.description`}
                                                        render={({ field }) => (
                                                            <FormItem className="md:col-span-2">
                                                                <FormLabel>Description</FormLabel>
                                                                <FormControl>
                                                                    <Textarea {...field} placeholder="Option description" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`options.${index}.unit`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Unit</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} placeholder="package, night, etc." />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`options.${index}.max_quantity`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Max Quantity</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`options.${index}.is_active`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                    />
                                                                </FormControl>
                                                                <div className="space-y-1 leading-none">
                                                                    <FormLabel>Active</FormLabel>
                                                                </div>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Pricing Tiers Tab */}
                    {activeTab === 'tiers' && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Pricing Tiers</CardTitle>
                                        <CardDescription>Set different prices based on group size</CardDescription>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => appendTier({
                                            min_persons: '1',
                                            max_persons: '',
                                            price_per_person: form.watch('price_per_person') || '0',
                                            discount_percentage: '',
                                            is_active: true,
                                        })}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Tier
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {tierFields.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No pricing tiers added. Click "Add Tier" to get started.
                                    </div>
                                ) : (
                                    tierFields.map((field, index) => (
                                        <Card key={field.id}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <h4 className="font-medium">Tier {index + 1}</h4>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeTier(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`pricing_tiers.${index}.min_persons`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Min Persons</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`pricing_tiers.${index}.max_persons`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Max Persons (optional)</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`pricing_tiers.${index}.price_per_person`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Price Per Person</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`pricing_tiers.${index}.discount_percentage`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Discount %</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`pricing_tiers.${index}.is_active`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                    />
                                                                </FormControl>
                                                                <div className="space-y-1 leading-none">
                                                                    <FormLabel>Active</FormLabel>
                                                                </div>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : initialData ? 'Update Package' : 'Create Package'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}

