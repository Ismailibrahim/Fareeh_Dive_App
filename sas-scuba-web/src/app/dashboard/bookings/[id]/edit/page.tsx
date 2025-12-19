"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BookingForm } from "@/components/bookings/BookingForm";
import { Booking, bookingService } from "@/lib/api/services/booking.service";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function EditBookingPage() {
    const params = useParams();
    const bookingId = params.id as string;
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const data = await bookingService.getById(bookingId);
                setBooking(data);
            } catch (error) {
                console.error("Failed to fetch booking", error);
            } finally {
                setLoading(false);
            }
        };

        if (bookingId) {
            fetchBooking();
        }
    }, [bookingId]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Booking" />
                <div className="flex-1 space-y-6 p-8 pt-6">
                    <div className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Booking" />
                <div className="flex-1 space-y-6 p-8 pt-6">
                    <div className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">Booking not found.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Edit Booking" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/bookings">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Edit Booking</h2>
                        <p className="text-muted-foreground">Update the booking details below.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    <BookingForm initialData={booking} bookingId={bookingId} />
                </div>
            </div>
        </div>
    );
}

