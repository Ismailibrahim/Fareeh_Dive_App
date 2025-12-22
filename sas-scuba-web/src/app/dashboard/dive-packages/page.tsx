"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { divePackageService, DivePackage } from "@/lib/api/services/dive-package.service";
import { useRouter } from "next/navigation";
import { Plus, Package } from "lucide-react";
import Link from "next/link";
import { safeFormatDate } from "@/lib/utils/date-format";

export default function DivePackagesPage() {
    const router = useRouter();
    const [packages, setPackages] = useState<DivePackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<{ status?: string; customer_id?: number }>({});

    useEffect(() => {
        loadPackages();
    }, [filters]);

    const loadPackages = async () => {
        setLoading(true);
        try {
            const data = await divePackageService.getAll(filters);
            const packageList = Array.isArray(data) ? data : (data as any).data || [];
            setPackages(packageList);
        } catch (error) {
            console.error("Failed to load packages", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-800';
            case 'Completed':
                return 'bg-blue-100 text-blue-800';
            case 'Expired':
                return 'bg-red-100 text-red-800';
            case 'Cancelled':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dive Packages</h1>
                    <p className="text-muted-foreground">Manage dive packages and track usage</p>
                </div>
                <Button onClick={() => router.push('/dashboard/dive-packages/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Package
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        <select
                            className="px-3 py-2 border rounded-md"
                            value={filters.status || ''}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                        >
                            <option value="">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Completed">Completed</option>
                            <option value="Expired">Expired</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Packages List */}
            {loading ? (
                <div className="text-center py-8">Loading packages...</div>
            ) : packages.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No packages found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {packages.map((pkg) => {
                        const remaining = pkg.package_total_dives - pkg.package_dives_used;
                        const progress = (pkg.package_dives_used / pkg.package_total_dives) * 100;

                        return (
                            <Card key={pkg.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    href={`/dashboard/dive-packages/${pkg.id}`}
                                                    className="font-semibold text-lg hover:underline"
                                                >
                                                    {pkg.package_price_list_item?.name || `Package #${pkg.id}`}
                                                </Link>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pkg.status)}`}>
                                                    {pkg.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {pkg.customer?.full_name || 'Unknown Customer'}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span>
                                                    {pkg.package_dives_used} / {pkg.package_total_dives} dives used
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {remaining} remaining
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-primary h-2 rounded-full transition-all"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>
                                                    Start: {safeFormatDate(pkg.package_start_date, "MMM d, yyyy", "N/A")}
                                                </span>
                                                {pkg.package_end_date && (
                                                    <span>
                                                        End: {safeFormatDate(pkg.package_end_date, "MMM d, yyyy", "N/A")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-semibold">${pkg.package_total_price.toFixed(2)}</p>
                                            {pkg.package_per_dive_price && (
                                                <p className="text-sm text-muted-foreground">
                                                    ${pkg.package_per_dive_price.toFixed(2)} per dive
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

