"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { divePackageService, DivePackage, DivePackageStatus } from "@/lib/api/services/dive-package.service";
import { Package, Calendar, User, DollarSign } from "lucide-react";
import { safeFormatDate } from "@/lib/utils/date-format";
import Link from "next/link";

export default function DivePackageDetailPage() {
    const params = useParams();
    const router = useRouter();
    const packageId = params.id as string;
    const [pkg, setPkg] = useState<DivePackage | null>(null);
    const [status, setStatus] = useState<DivePackageStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (packageId) {
            loadPackage();
            loadStatus();
        }
    }, [packageId]);

    const loadPackage = async () => {
        try {
            const data = await divePackageService.getById(packageId);
            setPkg(data);
        } catch (error) {
            console.error("Failed to load package", error);
        } finally {
            setLoading(false);
        }
    };

    const loadStatus = async () => {
        try {
            const data = await divePackageService.getStatus(Number(packageId));
            setStatus(data);
        } catch (error) {
            console.error("Failed to load package status", error);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading package...</div>;
    }

    if (!pkg) {
        return <div className="text-center py-8">Package not found</div>;
    }

    const progress = (pkg.package_dives_used / pkg.package_total_dives) * 100;

    return (
        <div className="space-y-6">
            <div>
                <Link href="/dashboard/dive-packages" className="text-sm text-muted-foreground hover:underline mb-2 block">
                    ← Back to Packages
                </Link>
                <h1 className="text-3xl font-bold">
                    {pkg.package_price_list_item?.name || `Package #${pkg.id}`}
                </h1>
                <p className="text-muted-foreground">
                    {pkg.customer?.full_name || 'Unknown Customer'}
                </p>
            </div>

            {/* Package Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Total Dives
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{pkg.package_total_dives}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Dives Used</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{pkg.package_dives_used}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-600">
                            {pkg.package_total_dives - pkg.package_dives_used}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Total Price
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">${pkg.package_total_price.toFixed(2)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Progress */}
            <Card>
                <CardHeader>
                    <CardTitle>Package Progress</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>{pkg.package_dives_used} of {pkg.package_total_dives} dives used</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                                className="bg-primary h-4 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Package Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Package Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <p>{pkg.status}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Duration</label>
                            <p>{pkg.package_duration_days} days</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                            <p>{safeFormatDate(pkg.package_start_date, "MMM d, yyyy", "N/A")}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">End Date</label>
                            <p>{safeFormatDate(pkg.package_end_date, "MMM d, yyyy", "N/A")}</p>
                        </div>
                        {pkg.package_per_dive_price && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Per Dive Price</label>
                                <p>${pkg.package_per_dive_price.toFixed(2)}</p>
                            </div>
                        )}
                    </div>
                    {pkg.notes && (
                        <div className="mt-4">
                            <label className="text-sm font-medium text-muted-foreground">Notes</label>
                            <p className="mt-1">{pkg.notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Bookings */}
            {pkg.bookings && pkg.bookings.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Bookings</CardTitle>
                        <CardDescription>Bookings associated with this package</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {pkg.bookings.map((booking) => (
                                <div key={booking.id} className="p-3 border rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Link
                                                href={`/dashboard/bookings/${booking.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                Booking #{booking.id}
                                            </Link>
                                            <p className="text-sm text-muted-foreground">
                                                {(booking as any).package_day_number ? `Day ${(booking as any).package_day_number} • ` : ''}{safeFormatDate(booking.booking_date, "MMM d, yyyy", "N/A")}
                                            </p>
                                        </div>
                                        <span className="text-sm">{booking.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Dives */}
            {pkg.booking_dives && pkg.booking_dives.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Dives</CardTitle>
                        <CardDescription>Dives scheduled in this package</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {pkg.booking_dives.map((dive) => (
                                <div key={dive.id} className="p-3 border rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Link
                                                href={`/dashboard/booking-dives/${dive.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                Dive #{dive.package_dive_number}
                                            </Link>
                                            <p className="text-sm text-muted-foreground">
                                                {dive.dive_site?.name || 'Unknown Site'} • {safeFormatDate(dive.dive_date, "MMM d, yyyy", "N/A")}
                                            </p>
                                        </div>
                                        <span className="text-sm">{dive.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

