"use client";

import { useState, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Header } from "@/components/layout/Header";
import { Booking } from "@/lib/api/services/booking.service";
import { useBookings, useDeleteBooking } from "@/lib/hooks/use-bookings";
import { Pagination } from "@/components/ui/pagination";
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
import { Search, MoreHorizontal, Calendar, Plus, User, FileText, Users } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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

export default function BookingsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);

    // Debounce search term (500ms delay)
    const debouncedSearch = useDebouncedCallback((value: string) => {
        setDebouncedSearchTerm(value);
        setCurrentPage(1); // Reset to first page on new search
    }, 500);

    // Fetch bookings using React Query
    const { data: bookingsData, isLoading, error } = useBookings({
        page: currentPage,
        per_page: 20,
        search: debouncedSearchTerm || undefined,
    });

    // Delete mutation
    const deleteMutation = useDeleteBooking();

    // Extract bookings and pagination from response
    const bookings = useMemo(() => {
        if (!bookingsData) return [];
        return bookingsData.data || [];
    }, [bookingsData]);

    const pagination = useMemo(() => {
        if (!bookingsData) {
            return {
                total: 0,
                per_page: 20,
                last_page: 1,
                current_page: 1,
            };
        }
        return {
            total: bookingsData.total || 0,
            per_page: bookingsData.per_page || 20,
            last_page: bookingsData.last_page || 1,
            current_page: bookingsData.current_page || currentPage,
        };
    }, [bookingsData, currentPage]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        debouncedSearch(value);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleDeleteClick = (booking: Booking) => {
        setBookingToDelete(booking);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!bookingToDelete) return;
        try {
            await deleteMutation.mutateAsync(bookingToDelete.id);
            setDeleteDialogOpen(false);
            setBookingToDelete(null);
        } catch (error) {
            console.error("Failed to delete booking", error);
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Pending':
                return 'secondary';
            case 'Confirmed':
                return 'default';
            case 'Completed':
                return 'default';
            case 'Cancelled':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    // Bookings are already filtered by the API, but we can do client-side filtering for instant feedback
    const filteredBookings = bookings;

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Bookings" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Bookings</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/bookings/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Booking
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search bookings..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="rounded-md border hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Booking Date</TableHead>
                                <TableHead>No of Divers</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell className="text-right">
                                                <Skeleton className="h-8 w-8 ml-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </>
                            ) : filteredBookings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No bookings found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <TableRow key={booking.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                {booking.customer?.full_name || 'Unknown Customer'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {booking.booking_date ? (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {safeFormatDate(booking.booking_date, "MMM d, yyyy", "-")}
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {booking.number_of_divers ? (
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    {booking.number_of_divers}
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(booking.status) as any}>
                                                {booking.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-[200px] truncate">
                                                {booking.notes || "-"}
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
                                                        <Link href={`/dashboard/bookings/${booking.id}/edit`}>
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleDeleteClick(booking)}
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
                    {isLoading ? (
                        <>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Card key={i}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-5 w-32" />
                                                <Skeleton className="h-6 w-20" />
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
                    ) : filteredBookings.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">No bookings found.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredBookings.map((booking) => (
                            <Card key={booking.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <User className="h-4 w-4" />
                                                Customer
                                            </CardDescription>
                                            <p className="font-medium">{booking.customer?.full_name || 'Unknown Customer'}</p>
                                        </div>
                                        <Badge variant={getStatusVariant(booking.status) as any}>
                                            {booking.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {booking.booking_date && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <Calendar className="h-4 w-4" />
                                                Booking Date
                                            </CardDescription>
                                            <p>{safeFormatDate(booking.booking_date, "MMM d, yyyy", "-")}</p>
                                        </div>
                                    )}
                                    {booking.number_of_divers && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <Users className="h-4 w-4" />
                                                No of Divers
                                            </CardDescription>
                                            <p>{booking.number_of_divers}</p>
                                        </div>
                                    )}
                                    {booking.notes && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <FileText className="h-4 w-4" />
                                                Notes
                                            </CardDescription>
                                            <p className="text-sm">{booking.notes}</p>
                                        </div>
                                    )}
                                    <div className="flex gap-2 pt-2">
                                        <Link href={`/dashboard/bookings/${booking.id}/edit`} className="flex-1">
                                            <Button variant="outline" className="w-full" size="sm">
                                                Edit
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleDeleteClick(booking)}
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
                {pagination.last_page > 1 && (
                    <div className="flex justify-center mt-4">
                        <Pagination
                            currentPage={pagination.current_page}
                            totalPages={pagination.last_page}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the booking
                            {bookingToDelete && ` for ${bookingToDelete.customer?.full_name || 'this customer'}`}.
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

