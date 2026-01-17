"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { packageBookingService, PackageBooking } from "@/lib/api/services/package-booking.service";
import { PackageBreakdown } from "@/components/packages/PackageBreakdown";
import { Package as PackageIcon, Calendar, Users, DollarSign, CheckCircle2 } from "lucide-react";
import { safeFormatDate } from "@/lib/utils/date-format";
import Link from "next/link";

export default function PackageBookingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params.id as string;
    const [booking, setBooking] = useState<PackageBooking | null>(null);
    const [breakdown, setBreakdown] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [creatingBookings, setCreatingBookings] = useState(false);

    useEffect(() => {
        if (bookingId) {
            loadBooking();
        }
    }, [bookingId]);

    const loadBooking = async () => {
        try {
            const data = await packageBookingService.getById(bookingId);
            setBooking(data);
            
            if (data.package) {
                try {
                    const breakdownData = await import("@/lib/api/services/package.service").then(m => 
                        m.packageService.getBreakdown(data.package!.id)
                    );
                    setBreakdown(breakdownData);
                } catch (error) {
                    console.error("Failed to load breakdown", error);
                }
            }
        } catch (error) {
            console.error("Failed to load booking", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBookings = async () => {
        if (!booking) return;
        
        setCreatingBookings(true);
        try {
            await packageBookingService.createBookings(booking.id, true);
            alert("Bookings created successfully!");
        } catch (error) {
            console.error("Failed to create bookings", error);
            alert("Failed to create bookings");
        } finally {
            setCreatingBookings(false);
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

    if (loading) {
        return <div className="text-center py-8">Loading booking...</div>;
    }

    if (!booking) {
        return <div className="text-center py-8">Booking not found</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{booking.booking_number}</h1>
                    <p className="text-muted-foreground">
                        {booking.package?.name || 'Unknown Package'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Price</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${booking.total_price.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Persons</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{booking.persons_count}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Start Date</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-semibold">
                            {safeFormatDate(booking.start_date, "MMM d, yyyy", "N/A")}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">End Date</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-semibold">
                            {safeFormatDate(booking.end_date, "MMM d, yyyy", "N/A")}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <div className="text-sm text-muted-foreground">Customer</div>
                                <div className="font-medium">
                                    {booking.customer?.full_name || 'Unknown'}
                                </div>
                            </div>
                            {booking.customer?.email && (
                                <div>
                                    <div className="text-sm text-muted-foreground">Email</div>
                                    <div className="font-medium">{booking.customer.email}</div>
                                </div>
                            )}
                            {booking.customer?.phone && (
                                <div>
                                    <div className="text-sm text-muted-foreground">Phone</div>
                                    <div className="font-medium">{booking.customer.phone}</div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Package Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <div className="text-sm text-muted-foreground">Package</div>
                                <div className="font-medium">
                                    {booking.package?.name || 'Unknown'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {booking.package?.package_code}
                                </div>
                            </div>
                            {booking.package && (
                                <>
                                    <div className="flex gap-4 text-sm">
                                        {booking.package.nights > 0 && (
                                            <span className="text-muted-foreground">
                                                {booking.package.nights} nights
                                            </span>
                                        )}
                                        {booking.package.days > 0 && (
                                            <span className="text-muted-foreground">
                                                {booking.package.days} days
                                            </span>
                                        )}
                                        {booking.package.total_dives > 0 && (
                                            <span className="text-muted-foreground">
                                                {booking.package.total_dives} dives
                                            </span>
                                        )}
                                    </div>
                                    <Link href={`/dashboard/packages/${booking.package.id}`}>
                                        <Button variant="outline" size="sm" className="mt-2">
                                            View Package Details
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {breakdown && (
                <PackageBreakdown breakdown={breakdown} />
            )}

            {booking.notes && (
                <Card>
                    <CardHeader>
                        <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{booking.notes}</p>
                    </CardContent>
                </Card>
            )}

            {booking.status !== 'CANCELLED' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                        <CardDescription>Convert this package booking to regular bookings for invoicing</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleCreateBookings}
                            disabled={creatingBookings}
                        >
                            {creatingBookings ? 'Creating...' : 'Create Regular Bookings'}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

