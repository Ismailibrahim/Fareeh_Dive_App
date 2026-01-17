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
import { excursionService, ExcursionFormData, Excursion } from "@/lib/api/services/excursion.service";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Users, Calendar } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const excursionSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    description: z.string().optional().or(z.literal("")),
    duration: z.string().optional().or(z.literal("")),
    location: z.string().optional().or(z.literal("")),
    capacity: z.string().optional().or(z.literal("")),
    meeting_point: z.string().optional().or(z.literal("")),
    departure_time: z.string().optional().or(z.literal("")),
    is_active: z.boolean().optional(),
});

interface ExcursionFormProps {
    initialData?: Excursion;
    excursionId?: string | number;
}

export function ExcursionForm({ initialData, excursionId }: ExcursionFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof excursionSchema>>({
        resolver: zodResolver(excursionSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            duration: initialData?.duration ? String(initialData.duration) : "",
            location: initialData?.location || "",
            capacity: initialData?.capacity ? String(initialData.capacity) : "",
            meeting_point: initialData?.meeting_point || "",
            departure_time: initialData?.departure_time || "",
            is_active: initialData?.is_active ?? true,
        },
    });

    async function onSubmit(data: z.infer<typeof excursionSchema>) {
        setLoading(true);
        try {
            const payload: ExcursionFormData = {
                name: data.name,
                description: data.description || undefined,
                duration: data.duration ? parseInt(data.duration) : undefined,
                location: data.location || undefined,
                capacity: data.capacity ? parseInt(data.capacity) : undefined,
                meeting_point: data.meeting_point || undefined,
                departure_time: data.departure_time || undefined,
                is_active: data.is_active,
            };

            if (excursionId) {
                await excursionService.update(Number(excursionId), payload);
            } else {
                await excursionService.create(payload);
            }
            router.push("/dashboard/excursions");
            router.refresh();
        } catch (error) {
            console.error("Failed to save excursion", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Excursion Information
                        </CardTitle>
                        <CardDescription>
                            Basic details about the excursion.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter excursion name" {...field} />
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
                                            placeholder="Enter excursion description"
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="duration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Duration (minutes)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="e.g., 120"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="capacity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Capacity
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="e.g., 20"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Location
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter location" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="meeting_point"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Meeting Point</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter meeting point" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="departure_time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Departure Time (HH:mm)
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="time"
                                            placeholder="e.g., 09:00"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Active</FormLabel>
                                        <CardDescription>
                                            Whether this excursion is currently available for booking.
                                        </CardDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/dashboard/excursions")}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : excursionId ? "Update Excursion" : "Create Excursion"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
