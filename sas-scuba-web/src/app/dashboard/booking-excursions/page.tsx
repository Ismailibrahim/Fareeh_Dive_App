"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BookingExcursion, bookingExcursionService } from "@/lib/api/services/booking-excursion.service";
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
import { Search, MoreHorizontal, Calendar, Plus, MapPin, Clock, Users, Eye } from "lucide-react";
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

export default function BookingExcursionsPage() {
    const [bookingExcursions, setBookingExcursions] = useState<BookingExcursion[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bookingExcursionToDelete, setBookingExcursionToDelete] = useState<BookingExcursion | null>(null);

    const fetchBookingExcursions = async () => {
        setLoading(true);
        try {
            const data = await bookingExcursionService.getAll();
            const bookingExcursionsList = Array.isArray(data) ? data : (data as any).data || [];
            setBookingExcursions(bookingExcursionsList);
        } catch (error) {
            console.error("Failed to fetch booking excursions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookingExcursions();
    }, []);

    // Refresh data when page comes into focus
    useEffect(() => {
        const handleFocus = () => {
            fetchBookingExcursions();
        };
        
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const handleDeleteClick = (bookingExcursion: BookingExcursion) => {
        setBookingExcursionToDelete(bookingExcursion);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!bookingExcursionToDelete) return;
        try {
            await bookingExcursionService.delete(bookingExcursionToDelete.id);
            setBookingExcursions(bookingExcursions.filter(be => be.id !== bookingExcursionToDelete.id));
        } catch (error) {
            console.error("Failed to delete booking excursion", error);
        } finally {
            setDeleteDialogOpen(false);
            setBookingExcursionToDelete(null);
        }
    };

    const filteredBookingExcursions = bookingExcursions.filter(bookingExcursion =>
        bookingExcursion.booking?.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bookingExcursion.excursion?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'In Progress':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'Cancelled':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Booking Excursions" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Booking Excursions</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/booking-excursions/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Book Excursion
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by customer or excursion..."
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
                                <TableHead>Customer</TableHead>
                                <TableHead>Excursion</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Participants</TableHead>
                                <TableHead>Price</TableHead>
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
                            ) : filteredBookingExcursions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        No booking excursions found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBookingExcursions.map((bookingExcursion) => (
                                    <TableRow key={bookingExcursion.id}>
                                        <TableCell className="font-medium">
                                            {bookingExcursion.booking?.customer?.full_name || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                {bookingExcursion.excursion?.name || '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {bookingExcursion.excursion_date ? (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {safeFormatDate(bookingExcursion.excursion_date, "MMM d, yyyy", "-")}
                                                </div>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {bookingExcursion.excursion_time ? (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    {bookingExcursion.excursion_time}
                                                </div>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                {bookingExcursion.number_of_participants || 1}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            ${bookingExcursion.price?.toFixed(2) || '0.00'}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(bookingExcursion.status)}`}>
                                                {bookingExcursion.status || 'Scheduled'}
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
                                                        <Link href={`/dashboard/booking-excursions/${bookingExcursion.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleDeleteClick(bookingExcursion)}
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
                    ) : filteredBookingExcursions.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">No booking excursions found.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredBookingExcursions.map((bookingExcursion) => (
                            <Card key={bookingExcursion.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardDescription>Customer</CardDescription>
                                            <p className="font-medium">{bookingExcursion.booking?.customer?.full_name || '-'}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(bookingExcursion.status)}`}>
                                            {bookingExcursion.status || 'Scheduled'}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <CardDescription className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            Excursion
                                        </CardDescription>
                                        <p>{bookingExcursion.excursion?.name || '-'}</p>
                                    </div>
                                    {bookingExcursion.excursion_date && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Date
                                            </CardDescription>
                                            <p>{safeFormatDate(bookingExcursion.excursion_date, "MMM d, yyyy", "-")}</p>
                                        </div>
                                    )}
                                    {bookingExcursion.excursion_time && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                Time
                                            </CardDescription>
                                            <p>{bookingExcursion.excursion_time}</p>
                                        </div>
                                    )}
                                    <div>
                                        <CardDescription className="flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Participants
                                        </CardDescription>
                                        <p>{bookingExcursion.number_of_participants || 1}</p>
                                    </div>
                                    <div>
                                        <CardDescription>Price</CardDescription>
                                        <p className="font-medium">${bookingExcursion.price?.toFixed(2) || '0.00'}</p>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Link href={`/dashboard/booking-excursions/${bookingExcursion.id}`} className="flex-1">
                                            <Button variant="outline" className="w-full" size="sm">
                                                View
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
                            This action cannot be undone. This will permanently delete the booking excursion.
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
