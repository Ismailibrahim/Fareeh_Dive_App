"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { DiveSite, diveSiteService } from "@/lib/api/services/dive-site.service";
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
import { Search, MoreHorizontal, MapPin, Plus, Ruler, FileText, Navigation, Users } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
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
import { Pagination } from "@/components/ui/pagination";

export default function DiveSitesPage() {
    const [diveSites, setDiveSites] = useState<DiveSite[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [meta, setMeta] = useState<any>(null);

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [diveSiteToDelete, setDiveSiteToDelete] = useState<DiveSite | null>(null);

    const fetchDiveSites = async (page = 1, search = "") => {
        setLoading(true);
        try {
            const response = await diveSiteService.getAll(page, search);
            // Laravel paginated response structure
            const diveSitesList = (response as any).data || [];
            const paginationMeta = {
                current_page: (response as any).current_page,
                last_page: (response as any).last_page,
                per_page: (response as any).per_page,
                total: (response as any).total,
            };
            
            setDiveSites(diveSitesList);
            setMeta(paginationMeta);
        } catch (error) {
            console.error("Failed to fetch dive sites", error);
        } finally {
            setLoading(false);
        }
    };

    // Use a simple effect-based debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchDiveSites(1, searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Handle page change
    const onPageChange = (page: number) => {
        setCurrentPage(page);
        fetchDiveSites(page, searchTerm);
    };

    // Refresh data when page comes into focus
    useEffect(() => {
        const handleFocus = () => {
            fetchDiveSites(currentPage, searchTerm);
        };
        
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [currentPage, searchTerm]);

    const handleDeleteClick = (diveSite: DiveSite) => {
        setDiveSiteToDelete(diveSite);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!diveSiteToDelete) return;
        try {
            await diveSiteService.delete(diveSiteToDelete.id);
            // After delete, refresh the current page
            fetchDiveSites(currentPage, searchTerm);
        } catch (error) {
            console.error("Failed to delete dive site", error);
        } finally {
            setDeleteDialogOpen(false);
            setDiveSiteToDelete(null);
        }
    };

    // We use diveSites directly now since searching is server-side
    const displayedDiveSites = diveSites;

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Dive Sites" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Dive Sites</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/dive-sites/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Dive Site
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search dive sites..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="rounded-md border hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>GPS Coordinates</TableHead>
                                <TableHead>Max Depth</TableHead>
                                <TableHead>Pax Capacity</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Skeleton className="h-10 w-10 rounded-full" />
                                                    <Skeleton className="h-4 w-32" />
                                                </div>
                                            </TableCell>
                                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell className="text-right">
                                                <Skeleton className="h-8 w-8 ml-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </>
                            ) : displayedDiveSites.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No dive sites found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                displayedDiveSites.map((diveSite) => (
                                    <TableRow key={diveSite.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0 border">
                                                    {diveSite.attachment && (
                                                        diveSite.attachment.toLowerCase().endsWith('.jpg') || 
                                                        diveSite.attachment.toLowerCase().endsWith('.jpeg') || 
                                                        diveSite.attachment.toLowerCase().endsWith('.png') ||
                                                        diveSite.attachment.toLowerCase().includes('image')
                                                    ) ? (
                                                        <img 
                                                            src={diveSite.attachment} 
                                                            alt={diveSite.name} 
                                                            className="h-full w-full object-cover"
                                                            onError={(e) => {
                                                                // If image fails to load, replace with icon
                                                                (e.target as any).style.display = 'none';
                                                                (e.target as any).parentElement.innerHTML = '<svg class="h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
                                                            }}
                                                        />
                                                    ) : (
                                                        <MapPin className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                {diveSite.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {diveSite.location ? (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <span className="max-w-[150px] truncate">{diveSite.location}</span>
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {diveSite.latitude != null && diveSite.longitude != null ? (
                                                <div className="flex items-center gap-2">
                                                    <Navigation className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-mono">
                                                        {diveSite.latitude.toFixed(6)}, {diveSite.longitude.toFixed(6)}
                                                    </span>
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {diveSite.max_depth ? (
                                                <div className="flex items-center gap-2">
                                                    <Ruler className="h-4 w-4 text-muted-foreground" />
                                                    {diveSite.max_depth}m
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {diveSite.pax_capacity ? (
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    {diveSite.pax_capacity}
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-[200px] truncate">
                                                {diveSite.description || "-"}
                                            </div>
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
                                                        <Link href={`/dashboard/dive-sites/${diveSite.id}/edit`}>
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleDeleteClick(diveSite)}
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
                        <>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Card key={i}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-5 w-32" />
                                                <Skeleton className="h-4 w-48" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Skeleton className="h-16" />
                                        <Skeleton className="h-16" />
                                        <Skeleton className="h-10" />
                                    </CardContent>
                                </Card>
                            ))}
                        </>
                    ) : displayedDiveSites.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">No dive sites found.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        displayedDiveSites.map((diveSite) => (
                            <Card key={diveSite.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <MapPin className="h-4 w-4" />
                                                Dive Site
                                            </CardDescription>
                                            <p className="font-medium truncate">{diveSite.name}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0 border">
                                            {diveSite.attachment && (
                                                diveSite.attachment.toLowerCase().endsWith('.jpg') || 
                                                diveSite.attachment.toLowerCase().endsWith('.jpeg') || 
                                                diveSite.attachment.toLowerCase().endsWith('.png') ||
                                                diveSite.attachment.toLowerCase().includes('image')
                                            ) ? (
                                                <img src={diveSite.attachment} alt={diveSite.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <MapPin className="h-6 w-6 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {diveSite.location && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <MapPin className="h-4 w-4" />
                                                Location
                                            </CardDescription>
                                            <p>{diveSite.location}</p>
                                        </div>
                                    )}
                                    {diveSite.latitude != null && diveSite.longitude != null && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <Navigation className="h-4 w-4" />
                                                GPS Coordinates
                                            </CardDescription>
                                            <p className="text-sm font-mono">
                                                {diveSite.latitude.toFixed(6)}, {diveSite.longitude.toFixed(6)}
                                            </p>
                                        </div>
                                    )}
                                    {diveSite.max_depth && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <Ruler className="h-4 w-4" />
                                                Max Depth
                                            </CardDescription>
                                            <p>{diveSite.max_depth}m</p>
                                        </div>
                                    )}
                                    {diveSite.pax_capacity && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <Users className="h-4 w-4" />
                                                Pax Capacity
                                            </CardDescription>
                                            <p>{diveSite.pax_capacity}</p>
                                        </div>
                                    )}
                                    {diveSite.description && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <FileText className="h-4 w-4" />
                                                Description
                                            </CardDescription>
                                            <p className="text-sm">{diveSite.description}</p>
                                        </div>
                                    )}
                                    <div className="flex gap-2 pt-2">
                                        <Link href={`/dashboard/dive-sites/${diveSite.id}/edit`} className="flex-1">
                                            <Button variant="outline" className="w-full" size="sm">
                                                Edit
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleDeleteClick(diveSite)}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {!loading && meta && meta.last_page > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={meta.last_page}
                        onPageChange={onPageChange}
                        itemsPerPage={meta.per_page}
                        totalItems={meta.total}
                    />
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the dive site
                            {diveSiteToDelete && ` "${diveSiteToDelete.name}"`}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

