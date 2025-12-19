"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BookingInstructor, bookingInstructorService } from "@/lib/api/services/booking-instructor.service";
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
import { Search, MoreHorizontal, Waves, Plus, User, Shield } from "lucide-react";
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

export default function BookingInstructorsPage() {
    const [bookingInstructors, setBookingInstructors] = useState<BookingInstructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bookingInstructorToDelete, setBookingInstructorToDelete] = useState<BookingInstructor | null>(null);

    const fetchBookingInstructors = async () => {
        setLoading(true);
        try {
            const data = await bookingInstructorService.getAll();
            const bookingInstructorsList = Array.isArray(data) ? data : (data as any).data || [];
            setBookingInstructors(bookingInstructorsList);
        } catch (error) {
            console.error("Failed to fetch booking instructors", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookingInstructors();
    }, []);

    // Refresh data when page comes into focus
    useEffect(() => {
        const handleFocus = () => {
            fetchBookingInstructors();
        };
        
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const handleDeleteClick = (bookingInstructor: BookingInstructor) => {
        setBookingInstructorToDelete(bookingInstructor);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!bookingInstructorToDelete) return;
        try {
            await bookingInstructorService.delete(bookingInstructorToDelete.id);
            setBookingInstructors(bookingInstructors.filter(bi => bi.id !== bookingInstructorToDelete.id));
        } catch (error) {
            console.error("Failed to delete booking instructor", error);
        } finally {
            setDeleteDialogOpen(false);
            setBookingInstructorToDelete(null);
        }
    };

    const filteredBookingInstructors = bookingInstructors.filter(bi =>
        bi.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bi.booking_dive?.dive_site?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bi.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Booking Instructors" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Booking Instructors</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/booking-instructors/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Booking Instructor
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search booking instructors..."
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
                                <TableHead>Booking Dive</TableHead>
                                <TableHead>Instructor</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredBookingInstructors.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No booking instructors found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBookingInstructors.map((bi) => (
                                    <TableRow key={bi.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Waves className="h-4 w-4 text-muted-foreground" />
                                                {bi.booking_dive?.dive_site?.name || `Booking Dive #${bi.booking_dive_id}`}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                {bi.user?.full_name || `User #${bi.user_id}`} {bi.user?.role ? `(${bi.user.role})` : ''}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {bi.role ? (
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                                    {bi.role}
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
                                                        <Link href={`/dashboard/booking-instructors/${bi.id}/edit`}>
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleDeleteClick(bi)}
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
                    ) : filteredBookingInstructors.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">No booking instructors found.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredBookingInstructors.map((bi) => (
                            <Card key={bi.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <Waves className="h-4 w-4" />
                                                Booking Dive
                                            </CardDescription>
                                            <p className="font-medium">{bi.booking_dive?.dive_site?.name || `Booking Dive #${bi.booking_dive_id}`}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <CardDescription className="flex items-center gap-2 mb-1">
                                            <User className="h-4 w-4" />
                                            Instructor
                                        </CardDescription>
                                        <p>{bi.user?.full_name || `User #${bi.user_id}`} {bi.user?.role ? `(${bi.user.role})` : ''}</p>
                                    </div>
                                    {bi.role && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2 mb-1">
                                                <Shield className="h-4 w-4" />
                                                Role
                                            </CardDescription>
                                            <p>{bi.role}</p>
                                        </div>
                                    )}
                                    <div className="flex gap-2 pt-2">
                                        <Link href={`/dashboard/booking-instructors/${bi.id}/edit`} className="flex-1">
                                            <Button variant="outline" className="w-full" size="sm">
                                                Edit
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleDeleteClick(bi)}
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
                            This action cannot be undone. This will permanently delete this booking instructor assignment.
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

