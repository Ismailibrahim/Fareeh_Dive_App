"use client";

import { Header } from "@/components/layout/Header";
import { BookingEquipmentForm } from "@/components/booking-equipment/BookingEquipmentForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { bookingEquipmentService, BookingEquipment } from "@/lib/api/services/booking-equipment.service";

export default function EditBookingEquipmentPage() {
    const params = useParams();
    const id = params.id as string;
    const [bookingEquipment, setBookingEquipment] = useState<BookingEquipment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchBookingEquipment = async () => {
            try {
                const data = await bookingEquipmentService.getById(id);
                setBookingEquipment(data);
            } catch (error) {
                console.error("Failed to fetch booking equipment", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookingEquipment();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Booking Equipment" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            </div>
        );
    }

    if (!bookingEquipment) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Booking Equipment" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-muted-foreground">Booking equipment not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Edit Booking Equipment" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/booking-equipment">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Edit Booking Equipment</h2>
                        <p className="text-muted-foreground">Update booking equipment details.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    <BookingEquipmentForm initialData={bookingEquipment} bookingEquipmentId={id} />
                </div>
            </div>
        </div>
    );
}

