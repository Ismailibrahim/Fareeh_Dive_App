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
import { boatService, BoatFormData, Boat } from "@/lib/api/services/boat.service";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ship, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const boatSchema = z.object({
    name: z.string().min(1, "Boat name is required"),
    capacity: z.string().optional().transform((val) => {
        if (!val || val === "") return undefined;
        const parsed = parseInt(val);
        return isNaN(parsed) ? undefined : parsed;
    }),
    active: z.boolean().optional(),
});

interface BoatFormProps {
    initialData?: Boat;
    boatId?: string | number;
}

export function BoatForm({ initialData, boatId }: BoatFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<BoatFormData>({
        resolver: zodResolver(boatSchema),
        defaultValues: {
            name: initialData?.name || "",
            capacity: initialData?.capacity ? String(initialData.capacity) : "",
            active: initialData?.active ?? true,
        },
    });

    async function onSubmit(data: z.infer<typeof boatSchema>) {
        setLoading(true);
        try {
            const payload: BoatFormData = {
                name: data.name,
                capacity: data.capacity,
                active: data.active ?? true,
            };

            if (boatId) {
                await boatService.update(boatId, payload);
            } else {
                await boatService.create(payload);
            }
            router.push("/dashboard/boats");
            router.refresh();
        } catch (error) {
            console.error("Failed to save boat", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Boat Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Ship className="h-5 w-5 text-primary" />
                            Boat Details
                        </CardTitle>
                        <CardDescription>
                            Basic information about the boat.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Boat Name</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Ship className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="e.g. Blue Dolphin" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="capacity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Capacity</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    type="number" 
                                                    placeholder="e.g. 20" 
                                                    className="pl-9" 
                                                    {...field}
                                                    value={field.value || ""}
                                                    onChange={(e) => field.onChange(e.target.value)}
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
                                name="active"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Active</FormLabel>
                                            <p className="text-sm text-muted-foreground">
                                                Check if this boat is currently active and available for use
                                            </p>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" size="lg" disabled={loading}>
                        {loading ? "Saving..." : (boatId ? "Update Boat" : "Create Boat")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

