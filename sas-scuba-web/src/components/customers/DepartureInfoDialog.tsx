"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Plane, Clock, MapPin, Calendar } from "lucide-react";
import { Customer } from "@/lib/api/services/customer.service";
import { useUpdateCustomer } from "@/lib/hooks/use-customers";

const departureSchema = z.object({
    departure_date: z.string().optional().or(z.literal("")),
    departure_flight: z.string().optional().or(z.literal("")),
    departure_flight_time: z.string().optional().or(z.literal("")),
    departure_to: z.string().optional().or(z.literal("")),
});

type DepartureValues = z.infer<typeof departureSchema>;

interface DepartureInfoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: Customer | null;
}

export function DepartureInfoDialog({ open, onOpenChange, customer }: DepartureInfoDialogProps) {
    const updateCustomer = useUpdateCustomer();

    const form = useForm<DepartureValues>({
        resolver: zodResolver(departureSchema),
        defaultValues: {
            departure_date: "",
            departure_flight: "",
            departure_flight_time: "",
            departure_to: "",
        },
    });

    useEffect(() => {
        if (customer && open) {
            form.reset({
                departure_date: customer.departure_date || "",
                departure_flight: customer.departure_flight || "",
                departure_flight_time: customer.departure_flight_time || "",
                departure_to: customer.departure_to || "",
            });
        }
    }, [customer, open, form]);

    async function onSubmit(data: DepartureValues) {
        if (!customer) return;

        try {
            await updateCustomer.mutateAsync({
                id: customer.id,
                data: {
                    ...data,
                    full_name: customer.full_name, // Required by API validation usually
                    email: customer.email,
                } as any,
            });
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to update departure info", error);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plane className="h-5 w-5 text-primary" />
                        Departure Information
                    </DialogTitle>
                    <DialogDescription>
                        Update departure details for {customer?.full_name}.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="departure_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Departure Date</FormLabel>
                                    <FormControl>
                                        <DatePicker
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Pick a date"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="departure_flight"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Flight Number</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Plane className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="EK 652" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="departure_flight_time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Flight Time</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="14:30" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="departure_to"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Destination (To)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Dubai (DXB)" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateCustomer.isPending}>
                                {updateCustomer.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
