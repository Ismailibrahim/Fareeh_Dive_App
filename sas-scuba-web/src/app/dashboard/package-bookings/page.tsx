"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { packageBookingService, PackageBooking } from "@/lib/api/services/package-booking.service";
import { useRouter } from "next/navigation";
import { Plus, Package } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { safeFormatDate } from "@/lib/utils/date-format";

export default function PackageBookingsPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState<PackageBooking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const data = await packageBookingService.getAll();
            const bookingList = Array.isArray(data) ? data : (data as any).data || [];
            setBookings(bookingList);
        } catch (error) {
            console.error("Failed to load bookings", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'CONFIRMED':
                return 'bg-blue-100 text-blue-800';
            case 'PAID':
                return 'bg-green-100 text-green-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            case 'COMPLETED':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Package Bookings</h1>
                    <p className="text-muted-foreground">Manage customer package bookings</p>
                </div>
                <Button onClick={() => router.push('/dashboard/package-bookings/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Booking
                </Button>
            </div>

            {/* Bookings List */}
            {loading ? (
                <div className="text-center py-8">Loading bookings...</div>
            ) : bookings.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No bookings found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {bookings.map((booking) => (
                        <Card key={booking.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-3">
                                            <Link
                                                href={`/dashboard/package-bookings/${booking.id}`}
                                                className="font-semibold text-lg hover:underline"
                                            >
                                                {booking.booking_number}
                                            </Link>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {booking.package?.name || 'Unknown Package'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {booking.customer?.full_name || 'Unknown Customer'}
                                        </p>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-muted-foreground">
                                                {booking.persons_count} {booking.persons_count === 1 ? 'person' : 'persons'}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {safeFormatDate(booking.start_date, "MMM d, yyyy", "N/A")} - {safeFormatDate(booking.end_date, "MMM d, yyyy", "N/A")}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-semibold">${booking.total_price.toFixed(2)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

