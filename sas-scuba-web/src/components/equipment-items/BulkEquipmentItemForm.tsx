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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { equipmentItemService, EquipmentItemFormData } from "@/lib/api/services/equipment-item.service";
import { equipmentService, Equipment } from "@/lib/api/services/equipment.service";
import { locationService, Location } from "@/lib/api/services/location.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Ruler, Hash, CheckCircle, Barcode, Tag, Palette, CalendarIcon, Wrench, Calculator, MapPin, Plus, Copy, Trash2, AlertCircle, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import DatePicker from "react-datepicker";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

const templateSchema = z.object({
    equipment_id: z.string().min(1, "Equipment is required"),
    location_id: z.string().optional().transform((val) => val === "" ? undefined : val),
    status: z.enum(['Available', 'Rented', 'Maintenance'], {
        required_error: "Status is required",
    }),
    purchase_date: z.string().optional(),
    requires_service: z.boolean().optional(),
    service_interval_days: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
    last_service_date: z.string().optional(),
    next_service_date: z.string().optional(),
});

const itemRowSchema = z.object({
    size: z.string().optional(),
    serial_no: z.string().optional(),
    inventory_code: z.string().optional(),
    brand: z.string().optional(),
    color: z.string().optional(),
    image_url: z.string().optional(),
});

const bulkFormSchema = z.object({
    template: templateSchema,
    items: z.array(itemRowSchema).min(1, "At least one item is required"),
}).superRefine((data, ctx) => {
    // Check for duplicate serial numbers (if provided)
    const serialNos = data.items.map(item => item.serial_no).filter(Boolean);
    const duplicateSerialNos = serialNos.filter((val, idx) => serialNos.indexOf(val) !== idx);
    if (duplicateSerialNos.length > 0) {
        data.items.forEach((item, index) => {
            if (duplicateSerialNos.includes(item.serial_no || "")) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Duplicate serial number",
                    path: ["items", index, "serial_no"],
                });
            }
        });
    }

    // Check for duplicate inventory codes (if provided)
    const inventoryCodes = data.items.map(item => item.inventory_code).filter(Boolean);
    const duplicateInventoryCodes = inventoryCodes.filter((val, idx) => inventoryCodes.indexOf(val) !== idx);
    if (duplicateInventoryCodes.length > 0) {
        data.items.forEach((item, index) => {
            if (duplicateInventoryCodes.includes(item.inventory_code || "")) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Duplicate inventory code",
                    path: ["items", index, "inventory_code"],
                });
            }
        });
    }
});

type BulkFormData = z.infer<typeof bulkFormSchema>;

export function BulkEquipmentItemForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [availableSizes, setAvailableSizes] = useState<string[]>([]);
    const [availableBrands, setAvailableBrands] = useState<string[]>([]);
    const [creationProgress, setCreationProgress] = useState<{ current: number, total: number } | null>(null);
    const [creationResults, setCreationResults] = useState<{ success: number, failed: number } | null>(null);

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const data = await equipmentService.getAll();
                const list = Array.isArray(data) ? data : (data as any).data || [];
                setEquipment(list);
            } catch (error) {
                console.error("Failed to load equipment", error);
            }
        };
        fetchEquipment();
    }, []);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const data = await locationService.getAll();
                const list = Array.isArray(data) ? data : [];
                setLocations(list.filter((loc) => loc.active));
            } catch (error) {
                console.error("Failed to load locations", error);
            }
        };
        fetchLocations();
    }, []);

    const form = useForm<BulkFormData>({
        resolver: zodResolver(bulkFormSchema),
        defaultValues: {
            template: {
                equipment_id: "",
                location_id: "",
                status: 'Available',
                purchase_date: "",
                requires_service: false,
                service_interval_days: "",
                last_service_date: "",
                next_service_date: "",
            },
            items: [],
        },
    });

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const selectedEquipmentId = form.watch('template.equipment_id');
    const requiresService = form.watch('template.requires_service');
    const serviceIntervalDays = form.watch('template.service_interval_days');
    const lastServiceDate = form.watch('template.last_service_date');
    const purchaseDate = form.watch('template.purchase_date');

    // Update available sizes and brands when equipment selection changes
    useEffect(() => {
        if (selectedEquipmentId) {
            const selectedEquipment = equipment.find((eq) => String(eq.id) === selectedEquipmentId);
            if (selectedEquipment?.sizes && selectedEquipment.sizes.length > 0) {
                setAvailableSizes(selectedEquipment.sizes);
            } else {
                setAvailableSizes([]);
            }
            if (selectedEquipment?.brands && selectedEquipment.brands.length > 0) {
                setAvailableBrands(selectedEquipment.brands);
            } else {
                setAvailableBrands([]);
            }
        } else {
            setAvailableSizes([]);
            setAvailableBrands([]);
        }
    }, [selectedEquipmentId, equipment]);

    // Auto-calculate next_service_date when relevant fields change
    useEffect(() => {
        if (requiresService && serviceIntervalDays && parseInt(serviceIntervalDays) > 0) {
            const baseDate = lastServiceDate || purchaseDate;
            if (baseDate) {
                try {
                    const date = new Date(baseDate);
                    if (!isNaN(date.getTime())) {
                        date.setDate(date.getDate() + parseInt(serviceIntervalDays));
                        const calculatedDate = date.toISOString().split('T')[0];
                        form.setValue('template.next_service_date', calculatedDate, { shouldValidate: false });
                    }
                } catch (error) {
                    console.error('Invalid date for calculation:', error);
                }
            } else {
                form.setValue('template.next_service_date', '', { shouldValidate: false });
            }
        } else if (!requiresService) {
            form.setValue('template.next_service_date', '', { shouldValidate: false });
        }
    }, [requiresService, serviceIntervalDays, lastServiceDate, purchaseDate, form]);

    const parseDate = (dateString: string | undefined): Date | null => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    };

    const formatDateToString = (date: Date | null): string => {
        if (!date) return "";
        return date.toISOString().split('T')[0];
    };

    const handleAddItem = () => {
        if (fields.length >= 50) {
            alert("Maximum 50 items allowed");
            return;
        }
        append({
            size: "",
            serial_no: "",
            inventory_code: "",
            brand: "",
            color: "",
            image_url: "",
        });
    };

    const handleDuplicateItem = (index: number) => {
        if (fields.length >= 50) {
            alert("Maximum 50 items allowed");
            return;
        }
        const itemToDuplicate = form.getValues(`items.${index}`);
        append({
            ...itemToDuplicate,
            serial_no: "", // Clear serial number to avoid duplicates
            inventory_code: "", // Clear inventory code to avoid duplicates
        });
    };

    const handleClearRow = (index: number) => {
        update(index, {
            size: "",
            serial_no: "",
            inventory_code: "",
            brand: "",
            color: "",
            image_url: "",
        });
    };

    async function onSubmit(data: BulkFormData) {
        if (!selectedEquipmentId) {
            form.setError('template.equipment_id', { message: 'Equipment is required' });
            return;
        }

        setLoading(true);
        setCreationProgress({ current: 0, total: data.items.length });
        setCreationResults(null);

        try {
            const itemsToCreate: EquipmentItemFormData[] = data.items.map((item) => {
                const payload: EquipmentItemFormData = {
                    equipment_id: parseInt(data.template.equipment_id),
                    location_id: data.template.location_id ? parseInt(data.template.location_id) : undefined,
                    size: item.size || undefined,
                    serial_no: item.serial_no || undefined,
                    inventory_code: item.inventory_code || undefined,
                    brand: item.brand || undefined,
                    color: item.color || undefined,
                    image_url: item.image_url || undefined,
                    status: data.template.status,
                    purchase_date: data.template.purchase_date || undefined,
                    requires_service: data.template.requires_service || false,
                    service_interval_days: data.template.service_interval_days || undefined,
                    last_service_date: data.template.last_service_date || undefined,
                    next_service_date: data.template.next_service_date || undefined,
                };
                return payload;
            });

            let successCount = 0;
            let failedCount = 0;

            for (let i = 0; i < itemsToCreate.length; i++) {
                try {
                    await equipmentItemService.create(itemsToCreate[i]);
                    successCount++;
                } catch (error) {
                    failedCount++;
                    console.error(`Failed to create item ${i + 1}:`, error);
                }
                setCreationProgress({ current: i + 1, total: itemsToCreate.length });
            }

            setCreationResults({ success: successCount, failed: failedCount });

            if (successCount > 0) {
                setTimeout(() => {
                    router.push("/dashboard/equipment-items");
                    router.refresh();
                }, 2000);
            }
        } catch (error) {
            console.error("Failed to create equipment items", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Template Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            Template Settings
                        </CardTitle>
                        <CardDescription>
                            Common fields that will be applied to all equipment items.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="template.equipment_id"
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
                                name="template.location_id"
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
                            name="template.status"
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

                        <FormField
                            control={form.control}
                            name="template.purchase_date"
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
                            name="template.requires_service"
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
                                            Check if these items need regular servicing
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
                                        name="template.service_interval_days"
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
                                        name="template.last_service_date"
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
                                    name="template.next_service_date"
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

                {/* Items Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Wrench className="h-5 w-5 text-primary" />
                                    Equipment Items
                                </CardTitle>
                                <CardDescription>
                                    Add individual items with varying details. Maximum 50 items.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {fields.length} of 50 items
                                </span>
                                <Button
                                    type="button"
                                    onClick={handleAddItem}
                                    disabled={!selectedEquipmentId || fields.length >= 50 || loading}
                                    size="sm"
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Item
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!selectedEquipmentId && (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Please select an equipment type in the template section above before adding items.
                                </AlertDescription>
                            </Alert>
                        )}

                        {fields.length === 0 && selectedEquipmentId && (
                            <div className="text-center py-8 text-muted-foreground">
                                No items added yet. Click "Add Item" to start.
                            </div>
                        )}

                        {fields.length > 0 && (
                            <div className="rounded-md border">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-24">Size</TableHead>
                                                <TableHead>Serial No</TableHead>
                                                <TableHead>Inventory Code</TableHead>
                                                <TableHead>Brand</TableHead>
                                                <TableHead>Color</TableHead>
                                                <TableHead>Image URL</TableHead>
                                                <TableHead className="w-32">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {fields.map((field, index) => (
                                                <TableRow key={field.id}>
                                                    <TableCell>
                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.size`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <Select
                                                                        onValueChange={field.onChange}
                                                                        value={field.value || ""}
                                                                        disabled={availableSizes.length === 0}
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger className="w-full">
                                                                                <SelectValue placeholder={availableSizes.length === 0 ? "No sizes" : "Select"} />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {availableSizes.map((size) => (
                                                                                <SelectItem key={size} value={size}>
                                                                                    {size}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.serial_no`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input placeholder="Serial number" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.inventory_code`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input placeholder="Inventory code" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.brand`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <Select
                                                                        onValueChange={field.onChange}
                                                                        value={field.value || ""}
                                                                        disabled={availableBrands.length === 0}
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger className="w-full">
                                                                                <SelectValue placeholder={availableBrands.length === 0 ? "No brands" : "Select"} />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {availableBrands.map((brand) => (
                                                                                <SelectItem key={brand} value={brand}>
                                                                                    {brand}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.color`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input placeholder="Color" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.image_url`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input placeholder="Image URL" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDuplicateItem(index)}
                                                                disabled={fields.length >= 50 || loading}
                                                                title="Duplicate row"
                                                            >
                                                                <Copy className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleClearRow(index)}
                                                                disabled={loading}
                                                                title="Clear row"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => remove(index)}
                                                                disabled={loading}
                                                                title="Remove row"
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Progress Indicator */}
                {creationProgress && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Creating items...</span>
                                    <span>{creationProgress.current} / {creationProgress.total}</span>
                                </div>
                                <Progress value={(creationProgress.current / creationProgress.total) * 100} />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Results */}
                {creationResults && (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Created {creationResults.success} item(s) successfully.
                            {creationResults.failed > 0 && ` ${creationResults.failed} item(s) failed.`}
                            {creationResults.success > 0 && " Redirecting to equipment items list..."}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" size="lg" onClick={() => router.back()} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" size="lg" disabled={loading || fields.length === 0 || !selectedEquipmentId}>
                        {loading ? "Creating..." : `Create ${fields.length} Item${fields.length !== 1 ? 's' : ''}`}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

