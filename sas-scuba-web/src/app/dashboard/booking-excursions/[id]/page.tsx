"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Clock, Users, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { bookingExcursionService, BookingExcursion } from "@/lib/api/services/booking-excursion.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { safeFormatDate } from "@/lib/utils/date-format";

export default function BookingExcursionDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [bookingExcursion, setBookingExcursion] = useState<BookingExcursion | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchBookingExcursion = async () => {
            try {
                const data = await bookingExcursionService.getById(id);
                setBookingExcursion(data);
            } catch (error) {
                console.error("Failed to fetch booking excursion", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookingExcursion();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Booking Excursion Details" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            </div>
        );
    }

    if (!bookingExcursion) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Booking Excursion Details" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-muted-foreground">Booking excursion not found</div>
                </div>
            </div>
        );
    }

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'In Progress':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'Cancelled':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Booking Excursion Details" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/booking-excursions">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold tracking-tight">
                            {bookingExcursion.excursion?.name || 'Booking Excursion'}
                        </h2>
                        <p className="text-muted-foreground">View booking excursion details</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Booking Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <CardDescription>Customer</CardDescription>
                                <p className="font-medium">{bookingExcursion.booking?.customer?.full_name || '-'}</p>
                            </div>
                            <div>
                                <CardDescription className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Excursion
                                </CardDescription>
                                <p className="font-medium">{bookingExcursion.excursion?.name || '-'}</p>
                            </div>
                            {bookingExcursion.excursion_date && (
                                <div>
                                    <CardDescription className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Excursion Date
                                    </CardDescription>
                                    <p>{safeFormatDate(bookingExcursion.excursion_date)}</p>
                                </div>
                            )}
                            {bookingExcursion.excursion_time && (
                                <div>
                                    <CardDescription className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Excursion Time
                                    </CardDescription>
                                    <p>{bookingExcursion.excursion_time}</p>
                                </div>
                            )}
                            <div>
                                <CardDescription className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Number of Participants
                                </CardDescription>
                                <p>{bookingExcursion.number_of_participants || 1}</p>
                            </div>
                            {bookingExcursion.price && (
                                <div>
                                    <CardDescription className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Price
                                    </CardDescription>
                                    <p className="font-medium">${bookingExcursion.price.toFixed(2)}</p>
                                </div>
                            )}
                            <div>
                                <CardDescription>Status</CardDescription>
                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(bookingExcursion.status)}`}>
                                    {bookingExcursion.status || 'Scheduled'}
                                </span>
                            </div>
                            {bookingExcursion.completed_at && (
                                <div>
                                    <CardDescription>Completed At</CardDescription>
                                    <p>{safeFormatDate(bookingExcursion.completed_at)}</p>
                                </div>
                            )}
                            {bookingExcursion.notes && (
                                <div>
                                    <CardDescription>Notes</CardDescription>
                                    <p className="text-sm whitespace-pre-wrap">{bookingExcursion.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {bookingExcursion.excursion && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Excursion Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {bookingExcursion.excursion.description && (
                                    <div>
                                        <CardDescription>Description</CardDescription>
                                        <p className="text-sm whitespace-pre-wrap">{bookingExcursion.excursion.description}</p>
                                    </div>
                                )}
                                {bookingExcursion.excursion.location && (
                                    <div>
                                        <CardDescription>Location</CardDescription>
                                        <p>{bookingExcursion.excursion.location}</p>
                                    </div>
                                )}
                                {bookingExcursion.excursion.duration && (
                                    <div>
                                        <CardDescription>Duration</CardDescription>
                                        <p>{bookingExcursion.excursion.duration} minutes</p>
                                    </div>
                                )}
                                {bookingExcursion.excursion.capacity && (
                                    <div>
                                        <CardDescription>Capacity</CardDescription>
                                        <p>{bookingExcursion.excursion.capacity} people</p>
                                    </div>
                                )}
                                {bookingExcursion.excursion.meeting_point && (
                                    <div>
                                        <CardDescription>Meeting Point</CardDescription>
                                        <p>{bookingExcursion.excursion.meeting_point}</p>
                                    </div>
                                )}
                                {bookingExcursion.excursion.departure_time && (
                                    <div>
                                        <CardDescription>Departure Time</CardDescription>
                                        <p>{bookingExcursion.excursion.departure_time}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
