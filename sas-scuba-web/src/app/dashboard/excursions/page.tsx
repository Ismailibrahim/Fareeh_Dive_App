"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Excursion, excursionService } from "@/lib/api/services/excursion.service";
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
import { Search, MoreHorizontal, MapPin, Plus, Clock, Users, Calendar } from "lucide-react";
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

export default function ExcursionsPage() {
    const [excursions, setExcursions] = useState<Excursion[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [excursionToDelete, setExcursionToDelete] = useState<Excursion | null>(null);

    const fetchExcursions = async () => {
        setLoading(true);
        try {
            const data = await excursionService.getAll();
            const excursionsList = Array.isArray(data) ? data : (data as any).data || [];
            setExcursions(excursionsList);
        } catch (error) {
            console.error("Failed to fetch excursions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExcursions();
    }, []);

    // Refresh data when page comes into focus
    useEffect(() => {
        const handleFocus = () => {
            fetchExcursions();
        };
        
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const handleDeleteClick = (excursion: Excursion) => {
        setExcursionToDelete(excursion);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!excursionToDelete) return;
        try {
            await excursionService.delete(excursionToDelete.id);
            setExcursions(excursions.filter(e => e.id !== excursionToDelete.id));
        } catch (error) {
            console.error("Failed to delete excursion", error);
        } finally {
            setDeleteDialogOpen(false);
            setExcursionToDelete(null);
        }
    };

    const filteredExcursions = excursions.filter(excursion =>
        excursion.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        excursion.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        excursion.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Excursions" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Excursions</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/excursions/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Excursion
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search excursions..."
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
                                <TableHead>Duration</TableHead>
                                <TableHead>Capacity</TableHead>
                                <TableHead>Meeting Point</TableHead>
                                <TableHead>Departure Time</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredExcursions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        No excursions found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredExcursions.map((excursion) => (
                                    <TableRow key={excursion.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                {excursion.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{excursion.location || "-"}</TableCell>
                                        <TableCell>
                                            {excursion.duration ? (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    {excursion.duration} min
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {excursion.capacity ? (
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    {excursion.capacity}
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>{excursion.meeting_point || "-"}</TableCell>
                                        <TableCell>
                                            {excursion.departure_time ? (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {excursion.departure_time}
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                excursion.is_active 
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                            }`}>
                                                {excursion.is_active ? 'Active' : 'Inactive'}
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
                                                        <Link href={`/dashboard/excursions/${excursion.id}`}>
                                                            View
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/excursions/${excursion.id}/edit`}>
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleDeleteClick(excursion)}
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
                    ) : filteredExcursions.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">No excursions found.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredExcursions.map((excursion) => (
                            <Card key={excursion.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <MapPin className="h-4 w-4" />
                                                Excursion
                                            </CardDescription>
                                            <p className="font-medium">{excursion.name}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            excursion.is_active 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                        }`}>
                                            {excursion.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {excursion.location && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <MapPin className="h-4 w-4" />
                                                Location
                                            </CardDescription>
                                            <p>{excursion.location}</p>
                                        </div>
                                    )}
                                    {excursion.duration && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <Clock className="h-4 w-4" />
                                                Duration
                                            </CardDescription>
                                            <p>{excursion.duration} minutes</p>
                                        </div>
                                    )}
                                    {excursion.capacity && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <Users className="h-4 w-4" />
                                                Capacity
                                            </CardDescription>
                                            <p>{excursion.capacity} people</p>
                                        </div>
                                    )}
                                    {excursion.meeting_point && (
                                        <div>
                                            <CardDescription>Meeting Point</CardDescription>
                                            <p className="text-sm">{excursion.meeting_point}</p>
                                        </div>
                                    )}
                                    {excursion.departure_time && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <Calendar className="h-4 w-4" />
                                                Departure Time
                                            </CardDescription>
                                            <p>{excursion.departure_time}</p>
                                        </div>
                                    )}
                                    <div className="flex gap-2 pt-2">
                                        <Link href={`/dashboard/excursions/${excursion.id}`} className="flex-1">
                                            <Button variant="outline" className="w-full" size="sm">
                                                View
                                            </Button>
                                        </Link>
                                        <Link href={`/dashboard/excursions/${excursion.id}/edit`} className="flex-1">
                                            <Button variant="outline" className="w-full" size="sm">
                                                Edit
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
                            This action cannot be undone. This will permanently delete the excursion
                            {excursionToDelete && ` "${excursionToDelete.name}"`}.
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
