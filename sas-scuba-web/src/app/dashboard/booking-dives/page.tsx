"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BookingDive, bookingDiveService } from "@/lib/api/services/booking-dive.service";
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
import { Search, MoreHorizontal, Calendar, Plus, MapPin, Ship, Clock, Users, Eye } from "lucide-react";
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

export default function BookingDivesPage() {
    const [bookingDives, setBookingDives] = useState<BookingDive[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bookingDiveToDelete, setBookingDiveToDelete] = useState<BookingDive | null>(null);

    const fetchBookingDives = async () => {
        setLoading(true);
        try {
            const data = await bookingDiveService.getAll();
            const bookingDivesList = Array.isArray(data) ? data : (data as any).data || [];
            setBookingDives(bookingDivesList);
        } catch (error) {
            console.error("Failed to fetch booking dives", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookingDives();
    }, []);

    // Refresh data when page comes into focus
    useEffect(() => {
        const handleFocus = () => {
            fetchBookingDives();
        };
        
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const handleDeleteClick = (bookingDive: BookingDive) => {
        setBookingDiveToDelete(bookingDive);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!bookingDiveToDelete) return;
        try {
            await bookingDiveService.delete(bookingDiveToDelete.id);
            setBookingDives(bookingDives.filter(bd => bd.id !== bookingDiveToDelete.id));
        } catch (error) {
            console.error("Failed to delete booking dive", error);
        } finally {
            setDeleteDialogOpen(false);
            setBookingDiveToDelete(null);
        }
    };

    const filteredBookingDives = bookingDives.filter(bookingDive =>
        bookingDive.booking?.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bookingDive.booking?.dive_group?.group_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bookingDive.dive_site?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bookingDive.boat?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Booking Dives" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Booking Dives</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/booking-dives/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Booking Dive
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search booking dives..."
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
                                <TableHead>Booking</TableHead>
                                <TableHead>Group</TableHead>
                                <TableHead>Dive Site</TableHead>
                                <TableHead>Boat</TableHead>
                                <TableHead>Dive Date</TableHead>
                                <TableHead>Dive Time</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell className="text-right">
                                                <Skeleton className="h-8 w-8 ml-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </>
                            ) : filteredBookingDives.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No booking dives found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBookingDives.map((bookingDive) => (
                                    <TableRow key={bookingDive.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                {bookingDive.booking?.customer?.full_name || `Booking #${bookingDive.booking_id}`}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {bookingDive.booking?.dive_group ? (
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    {bookingDive.booking.dive_group.group_name}
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                {bookingDive.dive_site?.name || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {bookingDive.boat ? (
                                                <div className="flex items-center gap-2">
                                                    <Ship className="h-4 w-4 text-muted-foreground" />
                                                    {bookingDive.boat.name}
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {bookingDive.dive_date ? (
                                                safeFormatDate(bookingDive.dive_date, "MMM d, yyyy", "-")
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {bookingDive.dive_time ? (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    {bookingDive.dive_time}
                                                </div>
                                            ) : (
                                                "-"
                                            )}
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
                                                        <Link href={`/dashboard/booking-dives/${bookingDive.id}`}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/booking-dives/${bookingDive.id}/edit`}>
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleDeleteClick(bookingDive)}
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
                    ) : filteredBookingDives.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">No booking dives found.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredBookingDives.map((bookingDive) => (
                            <Card key={bookingDive.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <Calendar className="h-4 w-4" />
                                                Booking
                                            </CardDescription>
                                            <p className="font-medium">{bookingDive.booking?.customer?.full_name || `Booking #${bookingDive.booking_id}`}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {bookingDive.booking?.dive_group && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <Users className="h-4 w-4" />
                                                Group
                                            </CardDescription>
                                            <p>{bookingDive.booking.dive_group.group_name}</p>
                                        </div>
                                    )}
                                    {bookingDive.dive_site && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <MapPin className="h-4 w-4" />
                                                Dive Site
                                            </CardDescription>
                                            <p>{bookingDive.dive_site.name}</p>
                                        </div>
                                    )}
                                    {bookingDive.boat && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <Ship className="h-4 w-4" />
                                                Boat
                                            </CardDescription>
                                            <p>{bookingDive.boat.name}</p>
                                        </div>
                                    )}
                                    {bookingDive.dive_date && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <Calendar className="h-4 w-4" />
                                                Dive Date
                                            </CardDescription>
                                            <p>{safeFormatDate(bookingDive.dive_date, "MMM d, yyyy", "-")}</p>
                                        </div>
                                    )}
                                    {bookingDive.dive_time && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <Clock className="h-4 w-4" />
                                                Dive Time
                                            </CardDescription>
                                            <p>{bookingDive.dive_time}</p>
                                        </div>
                                    )}
                                    <div className="flex gap-2 pt-2">
                                        <Link href={`/dashboard/booking-dives/${bookingDive.id}`} className="flex-1">
                                            <Button variant="outline" className="w-full" size="sm">
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Details
                                            </Button>
                                        </Link>
                                        <Link href={`/dashboard/booking-dives/${bookingDive.id}/edit`} className="flex-1">
                                            <Button variant="outline" className="w-full" size="sm">
                                                Edit
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleDeleteClick(bookingDive)}
                                        >
                                            Delete
                                        </Button>
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
                            This action cannot be undone. This will permanently delete this booking dive.
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

