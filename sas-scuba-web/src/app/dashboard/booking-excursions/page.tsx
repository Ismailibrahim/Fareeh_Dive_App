"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BookingExcursion, bookingExcursionService } from "@/lib/api/services/booking-excursion.service";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Search, MoreHorizontal, Calendar, Plus, MapPin, Clock, Users, Eye, Receipt
} from "lucide-react";
import { safeFormatDate } from "@/lib/utils/date-format";
import Link from "next/link";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CombinedInvoiceDialog } from "@/components/invoices/CombinedInvoiceDialog";

export default function BookingExcursionsPage() {
    const [bookingExcursions, setBookingExcursions] = useState<BookingExcursion[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [showCombineDialog, setShowCombineDialog] = useState(false);

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bookingExcursionToDelete, setBookingExcursionToDelete] = useState<BookingExcursion | null>(null);

    const fetchBookingExcursions = async () => {
        setLoading(true);
        try {
            const data = await bookingExcursionService.getAll();
            const list = Array.isArray(data) ? data : (data as any).data || [];
            setBookingExcursions(list);
        } catch (error) {
            console.error("Failed to fetch booking excursions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBookingExcursions(); }, []);

    useEffect(() => {
        const handleFocus = () => fetchBookingExcursions();
        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, []);

    // --- Selection helpers ---
    const toggleRow = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedIds.size === filteredBookingExcursions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredBookingExcursions.map((r) => r.id)));
        }
    };

    const selectedRows = bookingExcursions.filter((r) => selectedIds.has(r.id));
    // Get unique booking IDs from selected rows
    const selectedBookingIds = [...new Set(selectedRows.map((r) => r.booking_id).filter(Boolean))] as number[];

    // --- Delete ---
    const handleDeleteClick = (be: BookingExcursion) => {
        setBookingExcursionToDelete(be);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!bookingExcursionToDelete) return;
        try {
            await bookingExcursionService.delete(bookingExcursionToDelete.id);
            setBookingExcursions((prev) => prev.filter((be) => be.id !== bookingExcursionToDelete.id));
            setSelectedIds((prev) => { const next = new Set(prev); next.delete(bookingExcursionToDelete.id); return next; });
        } catch (error) {
            console.error("Failed to delete booking excursion", error);
        } finally {
            setDeleteDialogOpen(false);
            setBookingExcursionToDelete(null);
        }
    };

    const filteredBookingExcursions = bookingExcursions.filter((be) =>
        be.booking?.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        be.excursion?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status?: string) => {
        switch (status) {
            case "Completed":  return "bg-green-100 text-green-800";
            case "In Progress":return "bg-blue-100 text-blue-800";
            case "Cancelled":  return "bg-red-100 text-red-800";
            default:           return "bg-gray-100 text-gray-800";
        }
    };

    const allSelected =
        filteredBookingExcursions.length > 0 &&
        selectedIds.size === filteredBookingExcursions.length;

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Booking Excursions" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Booking Excursions</h2>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/invoices/create-combined">
                            <Button variant="outline">
                                <Receipt className="mr-2 h-4 w-4" />
                                Combined Invoice
                            </Button>
                        </Link>
                        <Link href="/dashboard/booking-excursions/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Book Excursion
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Search */}
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
                    {selectedIds.size > 0 && (
                        <span className="text-sm text-muted-foreground">
                            {selectedIds.size} selected
                        </span>
                    )}
                </div>

                {/* Desktop Table */}
                <div className="rounded-md border hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={toggleAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
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
                                    <TableCell colSpan={9} className="h-24 text-center">Loading...</TableCell>
                                </TableRow>
                            ) : filteredBookingExcursions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center">No booking excursions found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredBookingExcursions.map((be) => (
                                    <TableRow
                                        key={be.id}
                                        className={selectedIds.has(be.id) ? "bg-primary/5" : ""}
                                    >
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.has(be.id)}
                                                onCheckedChange={() => toggleRow(be.id)}
                                                aria-label={`Select booking ${be.id}`}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {be.booking?.customer?.full_name || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                {be.excursion?.name || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {be.excursion_date ? (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {safeFormatDate(be.excursion_date, "MMM d, yyyy", "-")}
                                                </div>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {be.excursion_time ? (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    {be.excursion_time}
                                                </div>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                {be.number_of_participants || 1}
                                            </div>
                                        </TableCell>
                                        <TableCell>${Number(be.price || 0).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(be.status)}`}>
                                                {be.status || "Scheduled"}
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
                                                        <Link href={`/dashboard/booking-excursions/${be.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" /> View
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
                        <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">Loading...</p></CardContent></Card>
                    ) : filteredBookingExcursions.length === 0 ? (
                        <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">No booking excursions found.</p></CardContent></Card>
                    ) : (
                        filteredBookingExcursions.map((be) => (
                            <Card key={be.id} className={selectedIds.has(be.id) ? "border-primary/50 bg-primary/5" : ""}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                checked={selectedIds.has(be.id)}
                                                onCheckedChange={() => toggleRow(be.id)}
                                            />
                                            <div>
                                                <CardDescription>Customer</CardDescription>
                                                <p className="font-medium">{be.booking?.customer?.full_name || "-"}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(be.status)}`}>
                                            {be.status || "Scheduled"}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <CardDescription className="flex items-center gap-2"><MapPin className="h-4 w-4" />Excursion</CardDescription>
                                        <p>{be.excursion?.name || "-"}</p>
                                    </div>
                                    {be.excursion_date && (
                                        <div>
                                            <CardDescription className="flex items-center gap-2"><Calendar className="h-4 w-4" />Date</CardDescription>
                                            <p>{safeFormatDate(be.excursion_date, "MMM d, yyyy", "-")}</p>
                                        </div>
                                    )}
                                    <div>
                                        <CardDescription>Price</CardDescription>
                                        <p className="font-medium">${Number(be.price || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Link href={`/dashboard/booking-excursions/${be.id}`} className="flex-1">
                                            <Button variant="outline" className="w-full" size="sm">View</Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Floating Selection Action Bar */}
            {selectedIds.size >= 2 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <div className="flex items-center gap-3 bg-foreground text-background rounded-full px-5 py-3 shadow-2xl border border-background/10">
                        <span className="text-sm font-medium">
                            {selectedIds.size} bookings selected
                        </span>
                        <Button
                            size="sm"
                            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-8"
                            onClick={() => setShowCombineDialog(true)}
                        >
                            <Receipt className="h-4 w-4 mr-1.5" />
                            Combine into Invoice
                        </Button>
                        <button
                            type="button"
                            className="text-background/60 hover:text-background text-sm ml-1"
                            onClick={() => setSelectedIds(new Set())}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Combined Invoice Dialog */}
            <CombinedInvoiceDialog
                open={showCombineDialog}
                onOpenChange={setShowCombineDialog}
                bookingIds={selectedBookingIds}
                selectedRows={selectedRows}
                onSuccess={() => {
                    setSelectedIds(new Set());
                    fetchBookingExcursions();
                }}
            />

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the booking excursion.
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
