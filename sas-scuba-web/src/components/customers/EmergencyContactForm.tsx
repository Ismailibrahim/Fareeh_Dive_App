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
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmergencyContactFormData, EmergencyContact } from "@/lib/api/services/emergency-contact.service";
import { relationshipService, Relationship } from "@/lib/api/services/relationship.service";
import { useCreateEmergencyContact, useUpdateEmergencyContact } from "@/lib/hooks/use-emergency-contacts";
import { useState, useEffect } from "react";
import { AlertCircle, User, Mail, Phone, MapPin, Users } from "lucide-react";

const emergencyContactSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().or(z.literal("")).optional(),
    phone_1: z.string().optional(),
    phone_2: z.string().optional(),
    phone_3: z.string().optional(),
    address: z.string().optional(),
    relationship: z.string().optional(),
    is_primary: z.boolean().optional(),
});

interface EmergencyContactFormProps {
    customerId: string | number;
    initialData?: EmergencyContact;
    onSave: () => void;
    onCancel: () => void;
}

export function EmergencyContactForm({ customerId, initialData, onSave, onCancel }: EmergencyContactFormProps) {
    const createMutation = useCreateEmergencyContact();
    const updateMutation = useUpdateEmergencyContact();
    const [relationships, setRelationships] = useState<Relationship[]>([]);
    const [loadingRelationships, setLoadingRelationships] = useState(true);
    
    const loading = createMutation.isPending || updateMutation.isPending;

    useEffect(() => {
        const fetchRelationships = async () => {
            try {
                setLoadingRelationships(true);
                const data = await relationshipService.getAll();
                setRelationships(data);
            } catch (error) {
                console.error("Failed to fetch relationships", error);
            } finally {
                setLoadingRelationships(false);
            }
        };
        fetchRelationships();
    }, []);

    const form = useForm<EmergencyContactFormData>({
        resolver: zodResolver(emergencyContactSchema),
        defaultValues: {
            name: initialData?.name || "",
            email: initialData?.email || "",
            phone_1: initialData?.phone_1 || "",
            phone_2: initialData?.phone_2 || "",
            phone_3: initialData?.phone_3 || "",
            address: initialData?.address || "",
            relationship: initialData?.relationship || "",
            is_primary: initialData?.is_primary || false,
        },
    });

    async function onSubmit(data: EmergencyContactFormData) {
        try {
            // Convert empty strings to undefined
            const payload: EmergencyContactFormData = {
                name: data.name && data.name.trim() !== '' ? data.name.trim() : undefined,
                email: data.email && data.email.trim() !== '' ? data.email.trim() : undefined,
                phone_1: data.phone_1 && data.phone_1.trim() !== '' ? data.phone_1.trim() : undefined,
                phone_2: data.phone_2 && data.phone_2.trim() !== '' ? data.phone_2.trim() : undefined,
                phone_3: data.phone_3 && data.phone_3.trim() !== '' ? data.phone_3.trim() : undefined,
                address: data.address && data.address.trim() !== '' ? data.address.trim() : undefined,
                relationship: data.relationship && data.relationship.trim() !== '' ? data.relationship.trim() : undefined,
                is_primary: data.is_primary || false,
            };

            if (initialData?.id) {
                await updateMutation.mutateAsync({ customerId, id: initialData.id, data: payload });
            } else {
                await createMutation.mutateAsync({ customerId, data: payload });
            }
            onSave();
        } catch (error) {
            console.error("Failed to save emergency contact", error);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    {initialData ? "Edit Emergency Contact" : "Add Emergency Contact"}
                </CardTitle>
                <CardDescription>
                    {initialData ? "Update emergency contact information." : "Add a new emergency contact for this customer."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Emergency Contact Name</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="John Doe" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input type="email" placeholder="john@example.com" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                                control={form.control}
                                name="phone_1"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone 1</FormLabel>
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
                                name="phone_2"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone 2</FormLabel>
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
                                name="phone_3"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone 3</FormLabel>
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
                        </div>
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="123 Main St, City, Country" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="relationship"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Relationship</FormLabel>
                                        <Select 
                                            onValueChange={field.onChange} 
                                            value={field.value || undefined}
                                            disabled={loadingRelationships}
                                        >
                                            <FormControl>
                                                <div className="relative">
                                                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                    <SelectTrigger className="pl-9 w-full">
                                                        <SelectValue placeholder={loadingRelationships ? "Loading..." : "Select relationship"} />
                                                    </SelectTrigger>
                                                </div>
                                            </FormControl>
                                            <SelectContent>
                                                {relationships.map((relationship) => (
                                                    <SelectItem key={relationship.id} value={relationship.name}>
                                                        {relationship.name}
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
                                name="is_primary"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Primary Contact</FormLabel>
                                            <FormDescription>
                                                Mark this as the primary emergency contact
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" size="lg" onClick={onCancel}>
                                Cancel
                            </Button>
                            <Button type="submit" size="lg" disabled={loading}>
                                {loading ? "Saving..." : (initialData ? "Update Contact" : "Add Contact")}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

