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
import { bookingInstructorService, BookingInstructorFormData, BookingInstructor } from "@/lib/api/services/booking-instructor.service";
import { bookingDiveService, BookingDive } from "@/lib/api/services/booking-dive.service";
import { userService, User } from "@/lib/api/services/user.service";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Waves, User as UserIcon, Shield } from "lucide-react";
import { safeFormatDate } from "@/lib/utils/date-format";

const bookingInstructorSchema = z.object({
    booking_dive_id: z.string().min(1, "Booking dive is required"),
    user_id: z.string().min(1, "Instructor is required"),
    role: z.string().optional().or(z.literal("")),
});

// Form values type (strings from form inputs)
type BookingInstructorFormValues = z.infer<typeof bookingInstructorSchema>;

interface BookingInstructorFormProps {
    initialData?: BookingInstructor;
    bookingInstructorId?: string | number;
}

export function BookingInstructorForm({ initialData, bookingInstructorId }: BookingInstructorFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [bookingDives, setBookingDives] = useState<BookingDive[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch booking dives
                const bookingDiveData = await bookingDiveService.getAll();
                const bookingDiveList = Array.isArray(bookingDiveData) ? bookingDiveData : (bookingDiveData as any).data || [];
                setBookingDives(bookingDiveList);

                // Fetch users (only Instructors and DiveMasters)
                const userData = await userService.getAll();
                const userList = Array.isArray(userData) ? userData : (userData as any).data || [];
                const instructorsAndDiveMasters = userList.filter((user: User) => 
                    user.role === 'Instructor' || user.role === 'DiveMaster'
                );
                setUsers(instructorsAndDiveMasters);
            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        fetchData();
    }, []);

    const form = useForm<BookingInstructorFormValues>({
        resolver: zodResolver(bookingInstructorSchema),
        defaultValues: {
            booking_dive_id: initialData?.booking_dive_id ? String(initialData.booking_dive_id) : "",
            user_id: initialData?.user_id ? String(initialData.user_id) : "",
            role: initialData?.role || "",
        },
    });

    async function onSubmit(data: BookingInstructorFormValues) {
        setLoading(true);
        try {
            const payload: BookingInstructorFormData = {
                booking_dive_id: parseInt(data.booking_dive_id),
                user_id: parseInt(data.user_id),
                role: data.role || undefined,
            };

            if (bookingInstructorId) {
                await bookingInstructorService.update(Number(bookingInstructorId), payload);
            } else {
                await bookingInstructorService.create(payload);
            }
            router.push("/dashboard/booking-instructors");
            router.refresh();
        } catch (error) {
            console.error("Failed to save booking instructor", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* Booking Dive Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Waves className="h-5 w-5 text-primary" />
                            Booking Dive Information
                        </CardTitle>
                        <CardDescription>
                            Select the booking dive this instructor is assigned to.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="booking_dive_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Booking Dive</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <div className="relative">
                                                <Waves className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                <SelectTrigger className="pl-9">
                                                    <SelectValue placeholder="Select booking dive" />
                                                </SelectTrigger>
                                            </div>
                                        </FormControl>
                                        <SelectContent>
                                            {bookingDives.map((bookingDive) => (
                                                <SelectItem key={bookingDive.id} value={String(bookingDive.id)}>
                                                    {bookingDive.booking?.customer?.full_name || `Booking #${bookingDive.booking_id}`} - {bookingDive.dive_site?.name || 'Dive Site'} {bookingDive.dive_date ? `(${safeFormatDate(bookingDive.dive_date, "MMM d, yyyy", "")})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Instructor Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-primary" />
                            Instructor Details
                        </CardTitle>
                        <CardDescription>
                            Select the instructor and assign their role for this dive.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="user_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Instructor</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <div className="relative">
                                                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                                <SelectTrigger className="pl-9">
                                                    <SelectValue placeholder="Select instructor" />
                                                </SelectTrigger>
                                            </div>
                                        </FormControl>
                                        <SelectContent>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={String(user.id)}>
                                                    {user.full_name} ({user.role})
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
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role (Optional)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                placeholder="e.g., Lead Instructor, Assistant" 
                                                className="pl-9" 
                                                {...field} 
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" size="lg" disabled={loading}>
                        {loading ? "Saving..." : (bookingInstructorId ? "Update Booking Instructor" : "Create Booking Instructor")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

