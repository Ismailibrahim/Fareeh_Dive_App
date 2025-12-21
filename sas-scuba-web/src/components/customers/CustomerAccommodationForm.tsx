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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerAccommodation, CustomerAccommodationFormData } from "@/lib/api/services/customer-accommodation.service";
import { useCreateCustomerAccommodation, useUpdateCustomerAccommodation } from "@/lib/hooks/use-customer-accommodations";
import { islandService, Island } from "@/lib/api/services/island.service";
import { useState, useEffect } from "react";
import { Building2, Phone, MapPin, Home, Key } from "lucide-react";

const accommodationSchema = z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    contact_no: z.string().optional(),
    island: z.string().optional(),
    room_no: z.string().optional(),
});

interface CustomerAccommodationFormProps {
    customerId: string | number;
    initialData?: CustomerAccommodation;
    onSave: () => void;
    onCancel: () => void;
}

export function CustomerAccommodationForm({ customerId, initialData, onSave, onCancel }: CustomerAccommodationFormProps) {
    const createMutation = useCreateCustomerAccommodation();
    const updateMutation = useUpdateCustomerAccommodation();
    
    const loading = createMutation.isPending || updateMutation.isPending;
    const [islands, setIslands] = useState<Island[]>([]);
    const [loadingIslands, setLoadingIslands] = useState(true);

    useEffect(() => {
        const fetchIslands = async () => {
            try {
                const data = await islandService.getAll();
                setIslands(data);
            } catch (error) {
                console.error("Failed to fetch islands", error);
            } finally {
                setLoadingIslands(false);
            }
        };
        fetchIslands();
    }, []);

    const form = useForm<CustomerAccommodationFormData>({
        resolver: zodResolver(accommodationSchema),
        defaultValues: {
            customer_id: Number(customerId),
            name: initialData?.name || "",
            address: initialData?.address || "",
            contact_no: initialData?.contact_no || "",
            island: initialData?.island || "",
            room_no: initialData?.room_no || "",
        },
    });

    async function onSubmit(data: CustomerAccommodationFormData) {
        try {
            // Convert empty strings to undefined
            const payload: CustomerAccommodationFormData = {
                customer_id: Number(customerId),
                name: data.name && data.name.trim() !== '' ? data.name.trim() : undefined,
                address: data.address && data.address.trim() !== '' ? data.address.trim() : undefined,
                contact_no: data.contact_no && data.contact_no.trim() !== '' ? data.contact_no.trim() : undefined,
                island: data.island && data.island.trim() !== '' ? data.island.trim() : undefined,
                room_no: data.room_no && data.room_no.trim() !== '' ? data.room_no.trim() : undefined,
            };

            if (initialData?.id) {
                await updateMutation.mutateAsync({ id: initialData.id, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            onSave();
        } catch (error) {
            console.error("Failed to save accommodation", error);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {initialData ? "Edit Accommodation Details" : "Add Accommodation Details"}
                </CardTitle>
                <CardDescription>
                    {initialData ? "Update accommodation information." : "Add accommodation details for this customer."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Hotel/Resort Name" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Street Address" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                                control={form.control}
                                name="contact_no"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact No</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="+1234567890" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="island"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Island</FormLabel>
                                        <Select 
                                            onValueChange={field.onChange} 
                                            value={field.value}
                                            disabled={loadingIslands || islands.length === 0}
                                        >
                                            <FormControl>
                                                <div className="relative">
                                                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                    <SelectTrigger className="pl-9">
                                                        <SelectValue placeholder={
                                                            loadingIslands 
                                                                ? "Loading..." 
                                                                : islands.length === 0 
                                                                ? "No islands available" 
                                                                : "Select island"
                                                        } />
                                                    </SelectTrigger>
                                                </div>
                                            </FormControl>
                                            {islands.length > 0 && (
                                                <SelectContent>
                                                    {islands.map((island) => (
                                                        <SelectItem key={island.id} value={island.name}>
                                                            {island.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            )}
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="room_no"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Room No</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="Room Number" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" size="lg" onClick={onCancel}>
                                Cancel
                            </Button>
                            <Button type="submit" size="lg" disabled={loading}>
                                {loading ? "Saving..." : (initialData ? "Update Accommodation" : "Add Accommodation")}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

