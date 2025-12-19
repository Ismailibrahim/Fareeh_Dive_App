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
import { Textarea } from "@/components/ui/textarea";
import { bookingService, BookingFormData, Booking } from "@/lib/api/services/booking.service";
import { customerService, Customer } from "@/lib/api/services/customer.service";
import { settingsService } from "@/lib/api/services/settings.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarIcon, User, FileText, CheckCircle, Users, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import { cn } from "@/lib/utils";

const bookingSchema = z.object({
    customer_id: z.string().min(1, "Customer is required"),
    start_date: z.date({ required_error: "Start date is required" }),
    number_of_divers: z.string().optional().or(z.literal("")),
    dive_site_id: z.string().optional().or(z.literal("")),
    status: z.enum(["Pending", "Confirmed", "Completed", "Cancelled"]).default("Pending"),
    notes: z.string().optional().or(z.literal("")),
});

interface BookingFormProps {
    initialData?: Booking;
    bookingId?: string | number;
}

export function BookingForm({ initialData, bookingId }: BookingFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [diveCenterId, setDiveCenterId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch customers
                const customerData = await customerService.getAll();
                const customerList = Array.isArray(customerData) ? customerData : (customerData as any).data || [];
                setCustomers(customerList);

                // Fetch dive center ID (only needed for create)
                if (!bookingId) {
                    const diveCenter = await settingsService.getDiveCenter();
                    setDiveCenterId(diveCenter.id);
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        fetchData();
    }, [bookingId]);

    const form = useForm<{
        customer_id: string;
        start_date?: Date;
        number_of_divers?: string;
        dive_site_id?: string;
        status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
        notes?: string;
    }>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            customer_id: initialData?.customer_id ? String(initialData.customer_id) : "",
            start_date: initialData?.start_date 
                ? new Date(initialData.start_date) 
                : initialData?.booking_date 
                    ? new Date(initialData.booking_date) 
                    : undefined,
            number_of_divers: initialData?.number_of_divers ? String(initialData.number_of_divers) : "",
            dive_site_id: initialData?.dive_site_id ? String(initialData.dive_site_id) : "",
            status: initialData?.status || "Pending",
            notes: initialData?.notes || "",
        },
    });

    async function onSubmit(data: {
        customer_id: string;
        start_date?: Date;
        number_of_divers?: string;
        dive_site_id?: string;
        status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
        notes?: string;
    }) {
        setLoading(true);
        setError(null);
        try {
            if (bookingId) {
                // For update, only send fields that can be updated
                const updateData: Partial<BookingFormData> = {
                    start_date: data.start_date ? format(data.start_date, "yyyy-MM-dd") : undefined,
                    number_of_divers: data.number_of_divers ? parseInt(data.number_of_divers) : undefined,
                    status: data.status,
                    notes: data.notes,
                };
                await bookingService.update(Number(bookingId), updateData);
                router.push("/dashboard/bookings");
                router.refresh();
            } else {
                // For create, send all required fields
                if (!diveCenterId) {
                    setError("Dive center information not available. Please refresh the page.");
                    setLoading(false);
                    return;
                }
                if (!data.start_date) {
                    setError("Start date is required.");
                    setLoading(false);
                    return;
                }
                
                const formData: BookingFormData = {
                    dive_center_id: diveCenterId,
                    customer_id: Number(data.customer_id),
                    start_date: format(data.start_date, "yyyy-MM-dd"),
                    number_of_divers: data.number_of_divers ? parseInt(data.number_of_divers) : undefined,
                    dive_site_id: data.dive_site_id ? parseInt(data.dive_site_id) : undefined,
                    status: data.status,
                    notes: data.notes,
                };
                await bookingService.create(formData);
                router.push("/dashboard/bookings");
                router.refresh();
            }
        } catch (error: any) {
            console.error("Failed to save booking", error);
            console.error("Error response:", error?.response?.data);
            
            // Extract error message from response
            const errorMessage = error?.response?.data?.message 
                || error?.response?.data?.error 
                || (error?.response?.data?.errors ? JSON.stringify(error.response.data.errors) : null)
                || error?.message 
                || "Failed to save booking. Please check all fields and try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                {/* Booking Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            Booking Information
                        </CardTitle>
                        <CardDescription>
                            Basic details about the booking.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="customer_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Customer</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                <SelectTrigger className="pl-9">
                                                    <SelectValue placeholder="Select a customer" />
                                                </SelectTrigger>
                                            </div>
                                        </FormControl>
                                        <SelectContent>
                                            {customers.map((customer) => (
                                                <SelectItem key={customer.id} value={String(customer.id)}>
                                                    {customer.full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="start_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Start Date</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                                                <DatePicker
                                                    selected={field.value}
                                                    onChange={(date) => field.onChange(date)}
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="number_of_divers"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Number of Divers</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    type="number" 
                                                    placeholder="e.g. 2" 
                                                    className="pl-9" 
                                                    value={field.value || ""}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                    onBlur={field.onBlur}
                                                    name={field.name}
                                                    ref={field.ref}
                                                    min="1"
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
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <div className="relative">
                                                <CheckCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                <SelectTrigger className="pl-9">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </div>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Confirmed">Confirmed</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Additional Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Additional Information
                        </CardTitle>
                        <CardDescription>
                            Additional notes and details about the booking.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Textarea
                                                placeholder="Enter any additional notes..."
                                                className="pl-9 min-h-[100px]"
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                name={field.name}
                                                ref={field.ref}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" size="lg" disabled={loading}>
                        {loading ? "Saving..." : (bookingId ? "Update Booking" : "Create Booking")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

