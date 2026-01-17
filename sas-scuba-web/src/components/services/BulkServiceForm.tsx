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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EquipmentItem, equipmentItemService } from "@/lib/api/services/equipment-item.service";
import { equipmentServiceHistoryService, BulkServiceFormData } from "@/lib/api/services/equipment-service-history.service";
import { serviceProviderService, ServiceProvider } from "@/lib/api/services/service-provider.service";
import { useState, useEffect } from "react";
import { Wrench, User, Building, DollarSign, Package, Calculator } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { safeFormatDate, safeCompareDates } from "@/lib/utils/date-format";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const bulkServiceSchema = z.object({
    equipment_item_ids: z.array(z.number()).min(1, "At least one equipment item must be selected"),
    service_date: z.string().min(1, "Service date is required"),
    service_type: z.string().optional(),
    technician: z.string().optional(),
    service_provider: z.string().optional(),
    cost: z.string().optional(),
    notes: z.string().optional(),
    next_service_due_date: z.string().optional(),
});

// Form values type (matches schema)
type BulkServiceFormValues = z.infer<typeof bulkServiceSchema>;

interface BulkServiceFormProps {
    onSuccess?: () => void;
}

export function BulkServiceForm({ onSuccess }: BulkServiceFormProps) {
    const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
    const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const form = useForm<BulkServiceFormValues>({
        resolver: zodResolver(bulkServiceSchema),
        defaultValues: {
            equipment_item_ids: [],
            service_date: new Date().toISOString().split('T')[0],
            service_type: "",
            technician: "",
            service_provider: "",
            cost: "",
            notes: "",
            next_service_due_date: "",
        },
    });

    const selectedIds = form.watch('equipment_item_ids');
    const serviceDate = form.watch('service_date');

    useEffect(() => {
        fetchEquipmentItems();
        fetchServiceProviders();
    }, []);

    const fetchEquipmentItems = async () => {
        setLoading(true);
        try {
            const data = await equipmentItemService.getAll();
            const itemsList = Array.isArray(data) ? data : (data as any).data || [];
            setEquipmentItems(itemsList);
        } catch (error) {
            console.error("Failed to fetch equipment items", error);
            setErrorMessage("Failed to load equipment items");
        } finally {
            setLoading(false);
        }
    };

    const fetchServiceProviders = async () => {
        try {
            const data = await serviceProviderService.getAll();
            setServiceProviders(data);
        } catch (error) {
            console.error("Failed to fetch service providers", error);
            // Don't show error message for service providers as it's not critical
        }
    };

    const filteredItems = equipmentItems.filter(item =>
        item.equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serial_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.size?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inventory_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectAll = () => {
        const allIds = filteredItems.map(item => item.id);
        form.setValue('equipment_item_ids', allIds);
    };

    const handleDeselectAll = () => {
        form.setValue('equipment_item_ids', []);
    };

    const handleToggleItem = (itemId: number) => {
        const currentIds = form.getValues('equipment_item_ids');
        if (currentIds.includes(itemId)) {
            form.setValue('equipment_item_ids', currentIds.filter(id => id !== itemId));
        } else {
            form.setValue('equipment_item_ids', [...currentIds, itemId]);
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Available':
                return 'default';
            case 'Rented':
                return 'secondary';
            case 'Maintenance':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    async function onSubmit(data: BulkServiceFormValues) {
        setSubmitting(true);
        try {
            const payload: BulkServiceFormData = {
                equipment_item_ids: data.equipment_item_ids,
                service_date: data.service_date,
                service_type: data.service_type && data.service_type !== "" ? data.service_type : undefined,
                technician: data.technician && data.technician !== "" ? data.technician : undefined,
                service_provider: data.service_provider && data.service_provider !== "" ? data.service_provider : undefined,
                cost: data.cost && data.cost !== "" ? parseFloat(data.cost) : undefined,
                notes: data.notes && data.notes !== "" ? data.notes : undefined,
                next_service_due_date: data.next_service_due_date && data.next_service_due_date !== "" ? data.next_service_due_date : undefined,
            };

            const response = await equipmentServiceHistoryService.bulkCreate(payload);
            
            setSuccessMessage(`${response.created_count} equipment item(s) serviced successfully`);
            setErrorMessage(null);

            // Reset form
            form.reset({
                equipment_item_ids: [],
                service_date: new Date().toISOString().split('T')[0],
                service_type: "",
                technician: "",
                service_provider: "",
                cost: "",
                notes: "",
                next_service_due_date: "",
            });

            // Refresh equipment items
            await fetchEquipmentItems();

            // Clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(null), 5000);

            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error("Failed to create bulk service", error);
            setErrorMessage(error?.response?.data?.message || "Failed to create service records");
            setSuccessMessage(null);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {successMessage && (
                    <Alert className="border-green-500 text-green-500 bg-green-50 dark:bg-green-900/10">
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                )}

                {errorMessage && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                )}

                {/* Equipment Selection Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Package className="h-5 w-5 text-primary" />
                                    Select Equipment Items
                                </CardTitle>
                                <CardDescription>
                                    Select the equipment items to send for service. {selectedIds.length > 0 && (
                                        <span className="font-medium text-primary">{selectedIds.length} item(s) selected</span>
                                    )}
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                                    Select All
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={handleDeselectAll}>
                                    Deselect All
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Input
                                placeholder="Search equipment items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="rounded-md border max-h-[400px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={filteredItems.length > 0 && filteredItems.every(item => selectedIds.includes(item.id))}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        handleSelectAll();
                                                    } else {
                                                        handleDeselectAll();
                                                    }
                                                }}
                                            />
                                        </TableHead>
                                        <TableHead>Equipment</TableHead>
                                        <TableHead>Inventory Code</TableHead>
                                        <TableHead>Brand</TableHead>
                                        <TableHead>Serial Number</TableHead>
                                        <TableHead>Last Service</TableHead>
                                        <TableHead>Next Service Due</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                No equipment items found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredItems.map((item) => (
                                            <TableRow 
                                                key={item.id}
                                                className={selectedIds.includes(item.id) ? "bg-muted/50" : ""}
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedIds.includes(item.id)}
                                                        onCheckedChange={() => handleToggleItem(item.id)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {item.equipment?.name || 'Unknown'}
                                                    {item.size && (
                                                        <span className="text-muted-foreground text-sm ml-2">({item.size})</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.inventory_code || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {item.brand || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {item.serial_no || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {safeFormatDate(item.last_service_date, "MMM d, yyyy", "-")}
                                                </TableCell>
                                                <TableCell>
                                                    {item.next_service_date ? (() => {
                                                        const comparison = safeCompareDates(item.next_service_date);
                                                        const isOverdue = comparison !== null && comparison <= 0 && item.requires_service;
                                                        return (
                                                            <div className="flex items-center gap-2">
                                                                {isOverdue ? (
                                                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                                                ) : (
                                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                                )}
                                                                <span className={isOverdue ? "text-destructive font-medium" : ""}>
                                                                    {safeFormatDate(item.next_service_date, "MMM d, yyyy", "-")}
                                                                </span>
                                                            </div>
                                                        );
                                                    })() : item.requires_service ? (
                                                        <span className="text-muted-foreground">Not set</span>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusVariant(item.status)}>
                                                        {item.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Service Form Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Wrench className="h-5 w-5 text-primary" />
                            Service Information
                        </CardTitle>
                        <CardDescription>
                            Enter the service details that will be applied to all selected items.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="service_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Service Date *</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Pick a service date"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="service_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Service Type</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="e.g. Regular Maintenance, Repair" className="pl-9" {...field} />
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
                                name="technician"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Technician</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="Technician name" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="service_provider"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Service Provider</FormLabel>
                                        <Select 
                                            onValueChange={field.onChange} 
                                            value={field.value || undefined}
                                        >
                                            <FormControl>
                                                <div className="relative">
                                                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                    <SelectTrigger className="pl-9">
                                                        <SelectValue placeholder="Select a service provider" />
                                                    </SelectTrigger>
                                                </div>
                                            </FormControl>
                                            <SelectContent>
                                                {serviceProviders.map((provider) => (
                                                    <SelectItem key={provider.id} value={provider.name}>
                                                        {provider.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="cost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cost</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input type="number" step="0.01" placeholder="0.00" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="next_service_due_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Next Service Due Date</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Pick a date"
                                                minDate={form.watch('service_date')}
                                            />
                                        </FormControl>
                                        <p className="text-sm text-muted-foreground">
                                            Leave empty to auto-calculate based on each item's service interval.
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Additional notes about the service..." className="resize-none" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="submit" size="lg" disabled={submitting || selectedIds.length === 0}>
                        {submitting ? "Processing..." : `Submit Service for ${selectedIds.length} Item(s)`}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

