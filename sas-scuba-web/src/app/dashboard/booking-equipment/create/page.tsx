"use client";

import { Header } from "@/components/layout/Header";
import { BookingEquipmentForm } from "@/components/booking-equipment/BookingEquipmentForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CreateBookingEquipmentContent() {
    const searchParams = useSearchParams();
    const basketId = searchParams?.get('basket_id');
    const bookingId = searchParams?.get('booking_id');

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="New Booking Equipment" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href={basketId ? `/dashboard/baskets/${basketId}` : "/dashboard/booking-equipment"}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Add New Booking Equipment</h2>
                        <p className="text-muted-foreground">
                            {basketId 
                                ? "Fill in the details below to add equipment to this basket."
                                : "Fill in the details below to add equipment rental to a booking or basket."
                            }
                        </p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    <BookingEquipmentForm 
                        basketId={basketId ? parseInt(basketId) : undefined}
                        bookingId={bookingId ? parseInt(bookingId) : undefined}
                    />
                </div>
            </div>
        </div>
    );
}

export default function CreateBookingEquipmentPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="New Booking Equipment" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        }>
            <CreateBookingEquipmentContent />
        </Suspense>
    );
}


