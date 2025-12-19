"use client";

import { Header } from "@/components/layout/Header";
import { BookingInstructorForm } from "@/components/booking-instructors/BookingInstructorForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { bookingInstructorService, BookingInstructor } from "@/lib/api/services/booking-instructor.service";

export default function EditBookingInstructorPage() {
    const params = useParams();
    const id = params.id as string;
    const [bookingInstructor, setBookingInstructor] = useState<BookingInstructor | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchBookingInstructor = async () => {
            try {
                const data = await bookingInstructorService.getById(id);
                setBookingInstructor(data);
            } catch (error) {
                console.error("Failed to fetch booking instructor", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookingInstructor();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Booking Instructor" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            </div>
        );
    }

    if (!bookingInstructor) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Booking Instructor" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-muted-foreground">Booking instructor not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Edit Booking Instructor" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/booking-instructors">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Edit Booking Instructor</h2>
                        <p className="text-muted-foreground">Update booking instructor assignment details.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    <BookingInstructorForm initialData={bookingInstructor} bookingInstructorId={id} />
                </div>
            </div>
        </div>
    );
}

