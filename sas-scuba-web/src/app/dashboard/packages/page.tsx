"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { packageService, Package } from "@/lib/api/services/package.service";
import { useRouter } from "next/navigation";
import { Plus, Package as PackageIcon, Search } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function PackagesPage() {
    const router = useRouter();
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadPackages();
    }, []);

    const loadPackages = async () => {
        setLoading(true);
        try {
            const data = await packageService.getAll({ is_active: true, search: searchTerm });
            const packageList = Array.isArray(data) ? data : (data as any).data || [];
            setPackages(packageList);
        } catch (error) {
            console.error("Failed to load packages", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadPackages();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Package Templates</h1>
                    <p className="text-muted-foreground">Manage reusable package templates</p>
                </div>
                <Button onClick={() => router.push('/dashboard/packages/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Package
                </Button>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search packages by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Packages List */}
            {loading ? (
                <div className="text-center py-8">Loading packages...</div>
            ) : packages.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <PackageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No packages found</p>
                        <Button
                            className="mt-4"
                            onClick={() => router.push('/dashboard/packages/create')}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Package
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {packages.map((pkg) => (
                        <Card key={pkg.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-3">
                                            <Link
                                                href={`/dashboard/packages/${pkg.id}`}
                                                className="font-semibold text-lg hover:underline"
                                            >
                                                {pkg.name}
                                            </Link>
                                            {pkg.is_active ? (
                                                <Badge variant="default">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary">Inactive</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {pkg.package_code}
                                        </p>
                                        {pkg.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {pkg.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 text-sm">
                                            {pkg.nights > 0 && (
                                                <span className="text-muted-foreground">
                                                    {pkg.nights} nights
                                                </span>
                                            )}
                                            {pkg.days > 0 && (
                                                <span className="text-muted-foreground">
                                                    {pkg.days} days
                                                </span>
                                            )}
                                            {pkg.total_dives > 0 && (
                                                <span className="text-muted-foreground">
                                                    {pkg.total_dives} dives
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-semibold">
                                            ${pkg.price_per_person.toFixed(2)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            per person
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Base: ${pkg.base_price.toFixed(2)}
                                        </p>
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

