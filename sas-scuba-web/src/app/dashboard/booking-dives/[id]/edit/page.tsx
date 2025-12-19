"use client";

import { Header } from "@/components/layout/Header";
import { BookingDiveForm } from "@/components/booking-dives/BookingDiveForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { bookingDiveService, BookingDive } from "@/lib/api/services/booking-dive.service";

export default function EditBookingDivePage() {
    const params = useParams();
    const id = params.id as string;
    const [bookingDive, setBookingDive] = useState<BookingDive | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchBookingDive = async () => {
            try {
                const data = await bookingDiveService.getById(id);
                setBookingDive(data);
            } catch (error) {
                console.error("Failed to fetch booking dive", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookingDive();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Booking Dive" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            </div>
        );
    }

    if (!bookingDive) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Booking Dive" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-muted-foreground">Booking dive not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Edit Booking Dive" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/booking-dives">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Edit Booking Dive</h2>
                        <p className="text-muted-foreground">Update booking dive details.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    <BookingDiveForm initialData={bookingDive} bookingDiveId={id} />
                </div>
            </div>
        </div>
    );
}

