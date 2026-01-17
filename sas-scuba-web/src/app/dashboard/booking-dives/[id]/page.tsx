"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { bookingDiveService, BookingDive } from "@/lib/api/services/booking-dive.service";
import { Waves, Calendar, Clock, Ship, User, MapPin, Gauge, FileText, ArrowLeft, Edit, CheckCircle, XCircle, Printer } from "lucide-react";
import { safeFormatDate } from "@/lib/utils/date-format";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function BookingDiveDetailPage() {
    const params = useParams();
    const router = useRouter();
    const diveId = params.id as string;
    const [dive, setDive] = useState<BookingDive | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (diveId) {
            loadDive();
        }
    }, [diveId]);

    // Reload dive when URL has refresh parameter
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('refresh') === 'true') {
            window.history.replaceState({}, '', window.location.pathname);
            setTimeout(() => {
                loadDive();
            }, 300);
        }
    }, [diveId]);

    const loadDive = async () => {
        try {
            const data = await bookingDiveService.getById(diveId);
            setDive(data);
        } catch (error) {
            console.error("Failed to load dive", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'In Progress':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'Scheduled':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'Cancelled':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getStatusVariant = (status?: string) => {
        switch (status) {
            case 'Completed':
                return 'default';
            case 'In Progress':
                return 'secondary';
            case 'Scheduled':
                return 'outline';
            case 'Cancelled':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Booking Dive Details" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading dive...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!dive) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Booking Dive Details" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-muted-foreground mb-4">Dive not found</p>
                        <Link href="/dashboard/booking-dives">
                            <Button variant="outline">
                                Back to Booking Dives
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Booking Dive Details" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/booking-dives">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                                <span className="sr-only">Back</span>
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                                <Waves className="h-8 w-8 text-primary" />
                                {dive.dive_site?.name || 'Booking Dive Details'}
                            </h2>
                            {dive.booking?.customer && (
                                <p className="text-muted-foreground">
                                    {dive.booking.customer.full_name}
                                </p>
                            )}
                            {dive.booking?.dive_group && (
                                <p className="text-muted-foreground">
                                    Group: {dive.booking.dive_group.group_name}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            onClick={() => window.open(`/dashboard/booking-dives/${diveId}/print`, '_blank')}
                            variant="outline"
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            Print Receipt
                        </Button>
                        <Link href={`/dashboard/booking-dives/${diveId}/edit`}>
                            <Button variant="outline">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                    <Badge variant={getStatusVariant(dive.status)} className="text-sm">
                        {dive.status || 'Scheduled'}
                    </Badge>
                    {dive.is_package_dive && dive.dive_package && (
                        <Badge variant="outline" className="text-sm">
                            Package Dive {dive.package_dive_number}/{dive.dive_package.package_total_dives}
                        </Badge>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Dive Site
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-semibold">{dive.dive_site?.name || 'N/A'}</p>
                        </CardContent>
                    </Card>
                    {dive.dive_date && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Dive Date
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg">
                                    {safeFormatDate(dive.dive_date, "MMM d, yyyy", "N/A")}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                    {dive.dive_time && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Dive Time
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg">{dive.dive_time}</p>
                            </CardContent>
                        </Card>
                    )}
                    {dive.boat && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Ship className="h-4 w-4" />
                                    Boat
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-semibold">{dive.boat.name}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Dive Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Waves className="h-5 w-5 text-primary" />
                                Dive Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Dive Site</label>
                                    <p className="font-semibold mt-1">{dive.dive_site?.name || 'N/A'}</p>
                                </div>
                                {dive.boat && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                            <Ship className="h-3 w-3" />
                                            Boat
                                        </label>
                                        <p className="font-semibold mt-1">{dive.boat.name}</p>
                                    </div>
                                )}
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4">
                                {dive.dive_date && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            Dive Date
                                        </label>
                                        <p className="mt-1">{safeFormatDate(dive.dive_date, "MMM d, yyyy", "-")}</p>
                                    </div>
                                )}
                                {dive.dive_time && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Dive Time
                                        </label>
                                        <p className="mt-1">{dive.dive_time}</p>
                                    </div>
                                )}
                            </div>
                            {dive.price_list_item && (
                                <>
                                    <Separator />
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Service Type</label>
                                        <p className="mt-1">{dive.price_list_item.name}</p>
                                    </div>
                                </>
                            )}
                            {dive.price !== undefined && dive.price !== null && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Price</label>
                                    <p className="font-semibold mt-1">${Number(dive.price).toFixed(2)}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Booking & Customer Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Booking & Customer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {dive.booking && (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Booking</label>
                                        <p className="mt-1">
                                            <Link 
                                                href={`/dashboard/bookings/${dive.booking.id}`} 
                                                className="font-semibold hover:underline text-primary"
                                            >
                                                Booking #{dive.booking.id}
                                            </Link>
                                        </p>
                                    </div>
                                    {dive.booking.booking_date && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Booking Date</label>
                                            <p className="mt-1">
                                                {safeFormatDate(dive.booking.booking_date, "MMM d, yyyy", "N/A")}
                                            </p>
                                        </div>
                                    )}
                                    {dive.booking.dive_group && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Group</label>
                                            <p className="mt-1 font-semibold">{dive.booking.dive_group.group_name}</p>
                                        </div>
                                    )}
                                    <Separator />
                                </>
                            )}
                            {dive.booking?.customer && (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Customer</label>
                                        <p className="font-semibold mt-1">
                                            <Link 
                                                href={`/dashboard/customers/${dive.booking.customer.id}`}
                                                className="hover:underline"
                                            >
                                                {dive.booking.customer.full_name}
                                            </Link>
                                        </p>
                                    </div>
                                    {dive.booking.customer.email && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                                            <p className="mt-1">{dive.booking.customer.email}</p>
                                        </div>
                                    )}
                                    {dive.booking.customer.phone && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Phone</label>
                                            <p className="mt-1">{dive.booking.customer.phone}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Dive Log Information */}
                {(dive.dive_duration || dive.max_depth || dive.dive_log_notes || dive.completed_at) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Dive Log
                            </CardTitle>
                            <CardDescription>
                                Actual dive details recorded after completion
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {dive.dive_duration && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Duration
                                        </label>
                                        <p className="text-lg font-semibold mt-1">{dive.dive_duration} minutes</p>
                                    </div>
                                )}
                                {dive.max_depth && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                            <Gauge className="h-3 w-3" />
                                            Max Depth
                                        </label>
                                        <p className="text-lg font-semibold mt-1">{dive.max_depth}m</p>
                                    </div>
                                )}
                                {dive.completed_at && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            Completed At
                                        </label>
                                        <p className="text-lg mt-1">
                                            {safeFormatDate(dive.completed_at, "MMM d, yyyy 'at' h:mm a", "N/A")}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {dive.dive_log_notes && (
                                <>
                                    <Separator className="my-4" />
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Notes</label>
                                        <p className="mt-2 whitespace-pre-wrap">{dive.dive_log_notes}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Instructors */}
                {dive.instructors && dive.instructors.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Instructors
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {dive.instructors.map((instructor) => (
                                    <div key={instructor.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-semibold">{instructor.user?.full_name || 'Unknown'}</p>
                                            {instructor.role && (
                                                <p className="text-sm text-muted-foreground">Role: {instructor.role}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Package Information */}
                {dive.is_package_dive && dive.dive_package && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Package Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Package Status</label>
                                    <p className="font-semibold mt-1">{dive.dive_package.status}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Dives Used</label>
                                    <p className="font-semibold mt-1">
                                        {dive.dive_package.package_dives_used} / {dive.dive_package.package_total_dives}
                                    </p>
                                </div>
                                {dive.package_dive_number && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">This Dive Number</label>
                                        <p className="font-semibold mt-1">{dive.package_dive_number}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

