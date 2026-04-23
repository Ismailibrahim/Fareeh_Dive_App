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
import { boatService, BoatFormData, Boat } from "@/lib/api/services/boat.service";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ship, Users, Key, Calendar as CalendarIcon, Database } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { SafeDatePicker as DatePicker } from "@/components/ui/safe-date-picker";
import { cn } from "@/lib/utils";

const boatSchema = z.object({
    name: z.string().min(1, "Boat name is required"),
    capacity: z.string().optional(),
    tank_capacity: z.string().optional(),
    active: z.boolean().optional(),
    ownership_type: z.enum(["Owned", "Rented"]),
    rent_start_date: z.string().optional(),
    rent_end_date: z.string().optional(),
});

interface BoatFormProps {
    initialData?: Boat;
    boatId?: string | number;
}

export function BoatForm({ initialData, boatId }: BoatFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form values type (strings from form inputs, transformed to numbers)
    type BoatFormValues = z.infer<typeof boatSchema>;
    
    const form = useForm<BoatFormValues>({
        resolver: zodResolver(boatSchema),
        defaultValues: {
            name: initialData?.name || "",
            capacity: initialData?.capacity ? String(initialData.capacity) : undefined,
            tank_capacity: initialData?.tank_capacity ? String(initialData.tank_capacity) : undefined,
            active: initialData?.active ?? true,
            ownership_type: initialData?.ownership_type || "Owned",
            rent_start_date: initialData?.rent_start_date ? String(initialData.rent_start_date).split('T')[0] : undefined,
            rent_end_date: initialData?.rent_end_date ? String(initialData.rent_end_date).split('T')[0] : undefined,
        },
    });

    const ownershipType = form.watch("ownership_type");

    async function onSubmit(data: BoatFormValues) {
        setLoading(true);
        try {
            const payload: BoatFormData = {
                name: data.name,
                capacity: data.capacity && data.capacity !== "" ? parseInt(data.capacity) : undefined,
                tank_capacity: data.tank_capacity && data.tank_capacity !== "" ? parseInt(data.tank_capacity) : undefined,
                active: data.active ?? true,
                ownership_type: data.ownership_type,
                is_owned: data.ownership_type === "Owned",
                rent_start_date: data.ownership_type === "Rented" ? data.rent_start_date : undefined,
                rent_end_date: data.ownership_type === "Rented" ? data.rent_end_date : undefined,
            };

            if (boatId) {
                await boatService.update(Number(boatId), payload);
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

    const formatDateToString = (date: Date | null): string => {
        if (!date) return "";
        return date.toISOString().split('T')[0];
    };

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
                                        <FormLabel>Person Capacity</FormLabel>
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
                                name="tank_capacity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tank Capacity</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Database className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    type="number" 
                                                    placeholder="e.g. 40" 
                                                    className="pl-9" 
                                                    {...field}
                                                    value={field.value || ""}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                    min="0"
                                                />
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
                                                Is this boat currently active?
                                            </p>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="ownership_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ownership Type</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger className="pl-9">
                                                    <SelectValue placeholder="Select ownership type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Owned">Owned</SelectItem>
                                                    <SelectItem value="Rented">Rented</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {ownershipType === "Rented" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-dashed border-primary/20">
                                <FormField
                                    control={form.control}
                                    name="rent_start_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Rent Start Date</FormLabel>
                                            <div className="relative">
                                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                <DatePicker
                                                    selected={field.value}
                                                    onChange={(date) => field.onChange(formatDateToString(date))}
                                                    placeholderText="Select start date"
                                                    wrapperClassName="w-full"
                                                    className={cn(
                                                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                />
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="rent_end_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Rent End Date</FormLabel>
                                            <div className="relative">
                                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                <DatePicker
                                                    selected={field.value}
                                                    onChange={(date) => field.onChange(formatDateToString(date))}
                                                    placeholderText="Select end date"
                                                    wrapperClassName="w-full"
                                                    className={cn(
                                                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                />
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="md:col-span-2 text-xs text-muted-foreground italic">
                                    * Boat will automatically appear as Inactive once the Rent End Date is reached.
                                </div>
                            </div>
                        )}
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

