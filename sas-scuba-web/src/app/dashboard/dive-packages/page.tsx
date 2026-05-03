"use client";

import { useEffect, useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { DivePackage, divePackageService } from "@/lib/api/services/dive-package.service";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreHorizontal, Package, Plus, Calendar, Clock, Eye, Edit, DollarSign } from "lucide-react";
import { safeFormatDate } from "@/lib/utils/date-format";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function DivePackagesPage() {
    const [packages, setPackages] = useState<DivePackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [packageToDelete, setPackageToDelete] = useState<DivePackage | null>(null);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const data = await divePackageService.getAll();
            const packageList = Array.isArray(data) ? data : (data as any).data || [];
            setPackages(packageList);
        } catch (error) {
            console.error("Failed to fetch dive packages", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    // Refresh data when page comes into focus
    useEffect(() => {
        const handleFocus = () => {
            fetchPackages();
        };
        
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const handleDeleteClick = (pkg: DivePackage) => {
        setPackageToDelete(pkg);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!packageToDelete) return;
        try {
            await divePackageService.delete(packageToDelete.id);
            setPackages(packages.filter(p => p.id !== packageToDelete.id));
        } catch (error) {
            console.error("Failed to delete dive package", error);
        } finally {
            setDeleteDialogOpen(false);
            setPackageToDelete(null);
        }
    };

    const filteredPackages = useMemo(() => {
        return packages.filter(pkg => {
            const matchesSearch = 
                pkg.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pkg.package_price_list_item?.name?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === "all" || pkg.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [packages, searchTerm, statusFilter]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'Completed':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'Expired':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'Cancelled':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Dive Packages" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Dive Packages</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/dive-packages/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> New Package
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by customer or package..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-3 py-2 border rounded-md text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Expired">Expired</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>

                {/* Desktop Table View */}
                <div className="rounded-md border hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Package Name</TableHead>
                                <TableHead>Dives</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredPackages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No dive packages found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPackages.map((pkg) => (
                                    <TableRow key={pkg.id}>
                                        <TableCell className="font-medium">
                                            {pkg.customer?.full_name || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-muted-foreground" />
                                                {pkg.package_price_list_item?.name || `Package #${pkg.id}`}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{pkg.package_dives_used} / {pkg.package_total_dives} used</span>
                                                <span className="text-xs text-muted-foreground">{pkg.package_total_dives - pkg.package_dives_used} remaining</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {safeFormatDate(pkg.package_start_date, "MMM d, yyyy", "-")}
                                                </div>
                                                {pkg.package_end_date && (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {safeFormatDate(pkg.package_end_date, "MMM d, yyyy", "-")}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">${pkg.package_total_price.toFixed(2)}</span>
                                                {pkg.package_per_dive_price && (
                                                    <span className="text-xs text-muted-foreground">${pkg.package_per_dive_price.toFixed(2)}/dive</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(pkg.status)}`}>
                                                {pkg.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/dive-packages/${pkg.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/dive-packages/${pkg.id}/edit`}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleDeleteClick(pkg)}
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {loading ? (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">Loading...</p>
                            </CardContent>
                        </Card>
                    ) : filteredPackages.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">No dive packages found.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredPackages.map((pkg) => (
                            <Card key={pkg.id}>
                                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                    <div className="space-y-1">
                                        <CardDescription>Customer</CardDescription>
                                        <p className="font-medium">{pkg.customer?.full_name || '-'}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(pkg.status)}`}>
                                        {pkg.status}
                                    </span>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <CardDescription className="flex items-center gap-2">
                                            <Package className="h-4 w-4" />
                                            Package Name
                                        </CardDescription>
                                        <p>{pkg.package_price_list_item?.name || `Package #${pkg.id}`}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <CardDescription>Dives Used</CardDescription>
                                            <p>{pkg.package_dives_used} / {pkg.package_total_dives}</p>
                                        </div>
                                        <div>
                                            <CardDescription>Remaining</CardDescription>
                                            <p>{pkg.package_total_dives - pkg.package_dives_used}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <CardDescription className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Start Date
                                            </CardDescription>
                                            <p>{safeFormatDate(pkg.package_start_date, "MMM d, yyyy", "-")}</p>
                                        </div>
                                        <div>
                                            <CardDescription className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4" />
                                                Price
                                            </CardDescription>
                                            <p className="font-medium">${pkg.package_total_price.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Link href={`/dashboard/dive-packages/${pkg.id}`} className="flex-1">
                                            <Button variant="outline" className="w-full" size="sm">
                                                <Eye className="mr-2 h-4 w-4" /> View
                                            </Button>
                                        </Link>
                                        <Link href={`/dashboard/dive-packages/${pkg.id}/edit`} className="flex-1">
                                            <Button variant="outline" className="w-full" size="sm">
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the dive package
                            {packageToDelete?.package_price_list_item?.name && (
                                <> "<strong>{packageToDelete.package_price_list_item.name}</strong>"</>
                            )} for {packageToDelete?.customer?.full_name}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
