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
import { equipmentServiceHistoryService, EquipmentServiceHistoryFormData, EquipmentServiceHistory } from "@/lib/api/services/equipment-service-history.service";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, User, Building, DollarSign, FileText, Package, Calculator } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { EquipmentItem } from "@/lib/api/services/equipment-item.service";

const serviceHistorySchema = z.object({
    service_date: z.string().min(1, "Service date is required"),
    service_type: z.string().optional(),
    technician: z.string().optional(),
    service_provider: z.string().optional(),
    cost: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
    notes: z.string().optional(),
    parts_replaced: z.string().optional(),
    warranty_info: z.string().optional(),
    next_service_due_date: z.string().optional(),
});

interface ServiceHistoryFormProps {
    equipmentItemId: string | number;
    equipmentItem?: EquipmentItem;
    initialData?: EquipmentServiceHistory;
    serviceHistoryId?: string | number;
    onSuccess: () => void;
    onCancel: () => void;
}

export function ServiceHistoryForm({ 
    equipmentItemId, 
    equipmentItem,
    initialData, 
    serviceHistoryId,
    onSuccess, 
    onCancel 
}: ServiceHistoryFormProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<EquipmentServiceHistoryFormData>({
        resolver: zodResolver(serviceHistorySchema),
        defaultValues: {
            service_date: initialData?.service_date ? initialData.service_date.split('T')[0] : new Date().toISOString().split('T')[0],
            service_type: initialData?.service_type || "",
            technician: initialData?.technician || "",
            service_provider: initialData?.service_provider || "",
            cost: initialData?.cost ? String(initialData.cost) : "",
            notes: initialData?.notes || "",
            parts_replaced: initialData?.parts_replaced || "",
            warranty_info: initialData?.warranty_info || "",
            next_service_due_date: initialData?.next_service_due_date ? initialData.next_service_due_date.split('T')[0] : "",
        },
    });

    const serviceDate = form.watch('service_date');
    const serviceIntervalDays = equipmentItem?.service_interval_days;

    // Auto-calculate next_service_due_date when service_date changes
    useEffect(() => {
        if (serviceDate && serviceIntervalDays && serviceIntervalDays > 0 && !form.getValues('next_service_due_date')) {
            const date = new Date(serviceDate);
            date.setDate(date.getDate() + serviceIntervalDays);
            form.setValue('next_service_due_date', date.toISOString().split('T')[0]);
        }
    }, [serviceDate, serviceIntervalDays, form]);

    async function onSubmit(data: z.infer<typeof serviceHistorySchema>) {
        setLoading(true);
        try {
            const payload: EquipmentServiceHistoryFormData = {
                service_date: data.service_date,
                service_type: data.service_type || undefined,
                technician: data.technician || undefined,
                service_provider: data.service_provider || undefined,
                cost: data.cost || undefined,
                notes: data.notes || undefined,
                parts_replaced: data.parts_replaced || undefined,
                warranty_info: data.warranty_info || undefined,
                next_service_due_date: data.next_service_due_date || undefined,
            };

            if (serviceHistoryId) {
                await equipmentServiceHistoryService.update(equipmentItemId, serviceHistoryId, payload);
            } else {
                await equipmentServiceHistoryService.create(equipmentItemId, payload);
            }
            onSuccess();
        } catch (error) {
            console.error("Failed to save service history", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Wrench className="h-5 w-5 text-primary" />
                            {serviceHistoryId ? "Edit Service Record" : "Add Service Record"}
                        </CardTitle>
                        <CardDescription>
                            Record service details for this equipment item.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="service_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Service Date</FormLabel>
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
                                        <FormControl>
                                            <div className="relative">
                                                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="Service provider name" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

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
                                            minDate={serviceDate}
                                        />
                                    </FormControl>
                                    <p className="text-sm text-muted-foreground">
                                        Auto-calculated based on service date + interval. You can override manually.
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="parts_replaced"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Parts Replaced</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="List any parts that were replaced..." className="resize-none" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="warranty_info"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Warranty Information</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Warranty details, expiry dates, etc..." className="resize-none" {...field} />
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
                    <Button type="button" variant="outline" size="lg" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit" size="lg" disabled={loading}>
                        {loading ? "Saving..." : (serviceHistoryId ? "Update Service Record" : "Add Service Record")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

