"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { packageService, Package } from "@/lib/api/services/package.service";
import { PackageBreakdown } from "@/components/packages/PackageBreakdown";
import { Package as PackageIcon, Edit, Trash2, Calendar, DollarSign, Users } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

export default function PackageDetailPage() {
    const params = useParams();
    const router = useRouter();
    const packageId = params.id as string;
    const [pkg, setPkg] = useState<Package | null>(null);
    const [breakdown, setBreakdown] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (packageId) {
            loadPackage();
            loadBreakdown();
        }
    }, [packageId]);

    const loadPackage = async () => {
        try {
            const data = await packageService.getById(packageId);
            setPkg(data);
        } catch (error) {
            console.error("Failed to load package", error);
        } finally {
            setLoading(false);
        }
    };

    const loadBreakdown = async () => {
        try {
            const data = await packageService.getBreakdown(Number(packageId));
            setBreakdown(data);
        } catch (error) {
            console.error("Failed to load breakdown", error);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await packageService.delete(Number(packageId));
            router.push('/dashboard/packages');
        } catch (error) {
            console.error("Failed to delete package", error);
            alert("Failed to delete package");
        } finally {
            setDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading package...</div>;
    }

    if (!pkg) {
        return <div className="text-center py-8">Package not found</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{pkg.name}</h1>
                    <p className="text-muted-foreground">{pkg.package_code}</p>
                </div>
                <div className="flex gap-2">
                    <Link href={`/dashboard/packages/${pkg.id}/edit`}>
                        <Button variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                    </Link>
                    <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Price Per Person</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${pkg.price_per_person.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">{pkg.currency}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Base Price</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${pkg.base_price.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">Total package price</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pkg.is_active ? (
                            <Badge variant="default">Active</Badge>
                        ) : (
                            <Badge variant="secondary">Inactive</Badge>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Calendar className="h-4 w-4" />
                            Duration
                        </div>
                        <div className="text-lg font-semibold">
                            {pkg.nights} nights, {pkg.days} days
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <PackageIcon className="h-4 w-4" />
                            Dives
                        </div>
                        <div className="text-lg font-semibold">
                            {pkg.total_dives} dives
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Users className="h-4 w-4" />
                            Pricing Tiers
                        </div>
                        <div className="text-lg font-semibold">
                            {pkg.pricing_tiers?.length || 0} tiers
                        </div>
                    </CardContent>
                </Card>
            </div>

            {pkg.description && (
                <Card>
                    <CardHeader>
                        <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{pkg.description}</p>
                    </CardContent>
                </Card>
            )}

            {breakdown && (
                <PackageBreakdown breakdown={breakdown} />
            )}

            {/* Components */}
            {pkg.components && pkg.components.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Components</CardTitle>
                        <CardDescription>Package breakdown items</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {pkg.components.map((component) => (
                                <div key={component.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <div className="font-medium">{component.name}</div>
                                        {component.description && (
                                            <div className="text-sm text-muted-foreground">{component.description}</div>
                                        )}
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {component.component_type} • {component.quantity} {component.unit} • ${component.unit_price.toFixed(2)} each
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold">${component.total_price.toFixed(2)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Options */}
            {pkg.options && pkg.options.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Options</CardTitle>
                        <CardDescription>Optional add-ons</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {pkg.options.map((option) => (
                                <div key={option.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <div className="font-medium">{option.name}</div>
                                        {option.description && (
                                            <div className="text-sm text-muted-foreground">{option.description}</div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold">${option.price.toFixed(2)}</div>
                                        {option.unit && (
                                            <div className="text-sm text-muted-foreground">per {option.unit}</div>
                                        )}
                                        {!option.is_active && (
                                            <Badge variant="secondary" className="mt-1">Inactive</Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pricing Tiers */}
            {pkg.pricing_tiers && pkg.pricing_tiers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Pricing Tiers</CardTitle>
                        <CardDescription>Group pricing based on number of persons</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {pkg.pricing_tiers.map((tier) => (
                                <div key={tier.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <div className="font-medium">
                                            {tier.min_persons} {tier.max_persons ? `- ${tier.max_persons}` : '+'} persons
                                        </div>
                                        {tier.discount_percentage > 0 && (
                                            <div className="text-sm text-muted-foreground">
                                                {tier.discount_percentage}% discount
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold">${tier.price_per_person.toFixed(2)}</div>
                                        <div className="text-sm text-muted-foreground">per person</div>
                                        {!tier.is_active && (
                                            <Badge variant="secondary" className="mt-1">Inactive</Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Package?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{pkg.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

