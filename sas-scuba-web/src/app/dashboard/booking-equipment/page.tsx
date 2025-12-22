"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BookingEquipment, bookingEquipmentService } from "@/lib/api/services/booking-equipment.service";
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
import { Search, MoreHorizontal, Calendar, Plus, Package, DollarSign, ShoppingBasket, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

export default function BookingEquipmentPage() {
    const [bookingEquipment, setBookingEquipment] = useState<BookingEquipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bookingEquipmentToDelete, setBookingEquipmentToDelete] = useState<BookingEquipment | null>(null);

    const fetchBookingEquipment = async () => {
        setLoading(true);
        try {
            const data = await bookingEquipmentService.getAll();
            const bookingEquipmentList = Array.isArray(data) ? data : (data as any).data || [];
            setBookingEquipment(bookingEquipmentList);
        } catch (error) {
            console.error("Failed to fetch booking equipment", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookingEquipment();
    }, []);

    // Refresh data when page comes into focus
    useEffect(() => {
        const handleFocus = () => {
            fetchBookingEquipment();
        };
        
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const handleDeleteClick = (bookingEquipment: BookingEquipment) => {
        setBookingEquipmentToDelete(bookingEquipment);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!bookingEquipmentToDelete) return;
        try {
            await bookingEquipmentService.delete(bookingEquipmentToDelete.id);
            setBookingEquipment(bookingEquipment.filter(be => be.id !== bookingEquipmentToDelete.id));
        } catch (error) {
            console.error("Failed to delete booking equipment", error);
        } finally {
            setDeleteDialogOpen(false);
            setBookingEquipmentToDelete(null);
        }
    };

    const filteredBookingEquipment = bookingEquipment.filter(be =>
        be.booking?.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        be.equipment_item?.equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        be.equipment_item?.size?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        be.basket?.basket_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        be.customer_equipment_brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        be.customer_equipment_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Booking Equipment" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Booking Equipment</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/booking-equipment/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Booking Equipment
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search booking equipment..."
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
                                <TableHead>Booking/Basket</TableHead>
                                <TableHead>Equipment</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Price</TableHead>
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
                            ) : filteredBookingEquipment.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No booking equipment found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBookingEquipment.map((be) => (
                                    <TableRow key={be.id}>
                                        <TableCell className="font-medium">
                                            <div className="space-y-1">
                                                {be.booking && (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <Link 
                                                            href={`/dashboard/bookings/${be.booking_id}`}
                                                            className="hover:underline"
                                                        >
                                                            {be.booking.customer?.full_name || `Booking #${be.booking_id}`}
                                                        </Link>
                                                    </div>
                                                )}
                                                {be.basket && (
                                                    <div className="flex items-center gap-2">
                                                        <ShoppingBasket className="h-4 w-4 text-muted-foreground" />
                                                        <Link 
                                                            href={`/dashboard/baskets/${be.basket_id}`}
                                                            className="hover:underline text-sm"
                                                        >
                                                            {be.basket.basket_no}
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {be.equipment_source === 'Center' ? (
                                                    <div className="flex items-center gap-2">
                                                        <Package className="h-4 w-4 text-muted-foreground" />
                                                        <span>
                                                            {be.equipment_item?.equipment?.name || 'Equipment'} 
                                                            {be.equipment_item?.size && ` - ${be.equipment_item.size}`}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-0.5">
                                                        <div className="font-medium">
                                                            {be.customer_equipment_type || 'Custom Equipment'}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {be.customer_equipment_brand}
                                                            {be.customer_equipment_model && ` ${be.customer_equipment_model}`}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={be.equipment_source === 'Center' ? 'default' : 'secondary'}>
                                                {be.equipment_source}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={
                                                    be.assignment_status === 'Returned' ? 'default' :
                                                    be.assignment_status === 'Checked Out' ? 'secondary' :
                                                    be.assignment_status === 'Lost' ? 'destructive' : 'outline'
                                                }
                                            >
                                                {be.assignment_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm space-y-0.5">
                                                {be.checkout_date && (
                                                    <div>Checkout: {safeFormatDate(be.checkout_date, "MMM d, yyyy", "N/A")}</div>
                                                )}
                                                {be.return_date && (
                                                    <div>Return: {safeFormatDate(be.return_date, "MMM d, yyyy", "N/A")}</div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                ${Number(be.price || 0).toFixed(2)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {be.basket_id && (
                                                    <Link href={`/dashboard/baskets/${be.basket_id}`}>
                                                        <Button variant="outline" size="sm">
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View Basket
                                                        </Button>
                                                    </Link>
                                                )}
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
                                                            <Link href={`/dashboard/booking-equipment/${be.id}/edit`}>
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => handleDeleteClick(be)}
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
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
                    ) : filteredBookingEquipment.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">No booking equipment found.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredBookingEquipment.map((be) => (
                            <Card key={be.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            {be.booking && (
                                                <div>
                                                    <CardDescription className="flex items-center gap-2 mb-1">
                                                        <Calendar className="h-4 w-4" />
                                                        Booking
                                                    </CardDescription>
                                                    <Link 
                                                        href={`/dashboard/bookings/${be.booking_id}`}
                                                        className="font-medium hover:underline"
                                                    >
                                                        {be.booking.customer?.full_name || `Booking #${be.booking_id}`}
                                                    </Link>
                                                </div>
                                            )}
                                            {be.basket && (
                                                <div>
                                                    <CardDescription className="flex items-center gap-2 mb-1">
                                                        <ShoppingBasket className="h-4 w-4" />
                                                        Basket
                                                    </CardDescription>
                                                    <Link 
                                                        href={`/dashboard/baskets/${be.basket_id}`}
                                                        className="font-medium hover:underline"
                                                    >
                                                        {be.basket.basket_no}
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                        <Badge variant={be.equipment_source === 'Center' ? 'default' : 'secondary'}>
                                            {be.equipment_source}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <CardDescription className="flex items-center gap-2 mb-1">
                                            <Package className="h-4 w-4" />
                                            Equipment
                                        </CardDescription>
                                        {be.equipment_source === 'Center' ? (
                                            <p>
                                                {be.equipment_item?.equipment?.name || 'Equipment'} 
                                                {be.equipment_item?.size && ` - ${be.equipment_item.size}`}
                                            </p>
                                        ) : (
                                            <div>
                                                <p className="font-medium">{be.customer_equipment_type || 'Custom Equipment'}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {be.customer_equipment_brand}
                                                    {be.customer_equipment_model && ` ${be.customer_equipment_model}`}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <CardDescription>Status</CardDescription>
                                        <Badge 
                                            variant={
                                                be.assignment_status === 'Returned' ? 'default' :
                                                be.assignment_status === 'Checked Out' ? 'secondary' :
                                                be.assignment_status === 'Lost' ? 'destructive' : 'outline'
                                            }
                                        >
                                            {be.assignment_status}
                                        </Badge>
                                    </div>
                                    {(be.checkout_date || be.return_date) && (
                                        <div>
                                            <CardDescription>Dates</CardDescription>
                                            <div className="text-sm space-y-0.5">
                                                {be.checkout_date && (
                                                    <p>Checkout: {safeFormatDate(be.checkout_date, "MMM d, yyyy", "N/A")}</p>
                                                )}
                                                {be.return_date && (
                                                    <p>Return: {safeFormatDate(be.return_date, "MMM d, yyyy", "N/A")}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <CardDescription className="flex items-center gap-2 mb-1">
                                            <DollarSign className="h-4 w-4" />
                                            Price
                                        </CardDescription>
                                        <p>${Number(be.price || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        {be.basket_id && (
                                            <Link href={`/dashboard/baskets/${be.basket_id}`} className="flex-1">
                                                <Button variant="outline" className="w-full" size="sm">
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View Basket
                                                </Button>
                                            </Link>
                                        )}
                                        <Link href={`/dashboard/booking-equipment/${be.id}/edit`} className={be.basket_id ? "flex-1" : "flex-1"}>
                                            <Button variant="outline" className="w-full" size="sm">
                                                Edit
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleDeleteClick(be)}
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
                            This action cannot be undone. This will permanently delete this booking equipment record.
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

