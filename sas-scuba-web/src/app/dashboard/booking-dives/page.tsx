"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Search, MoreHorizontal, Calendar, Plus, MapPin, Ship, Clock, Users, Eye, Gauge, Filter, FileText, Edit, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { InvoiceGenerationDialog } from "@/components/invoices/InvoiceGenerationDialog";
import { EquipmentPreparationCard } from "@/components/booking-dives/EquipmentPreparationCard";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkInvoiceGenerationDialog } from "@/components/invoices/BulkInvoiceGenerationDialog";
import { AnimatePresence, motion } from "framer-motion";

export default function BookingDivesPage() {
    const router = useRouter();
    const [bookingDives, setBookingDives] = useState<BookingDive[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bookingDiveToDelete, setBookingDiveToDelete] = useState<BookingDive | null>(null);
    
    // Invoice state
    const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);

    // Equipment state
    const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
    const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);
    const [selectedCustomerNames, setSelectedCustomerNames] = useState<Record<number, string>>({});

    // Bulk selection state
    const [selectedBookingIds, setSelectedBookingIds] = useState<number[]>([]);
    const [bulkInvoiceDialogOpen, setBulkInvoiceDialogOpen] = useState(false);

    useEffect(() => {
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

        fetchBookingDives();

        // Refresh data when page comes into focus
        const handleFocus = () => {
            fetchBookingDives();
        };
        
        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
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

    const handleViewEquipment = (bookingDive: BookingDive) => {
        if (bookingDive.booking?.customer_id) {
            setSelectedCustomerIds([bookingDive.booking.customer_id]);
            if (bookingDive.booking.customer?.full_name) {
                setSelectedCustomerNames({
                    [bookingDive.booking.customer_id]: bookingDive.booking.customer.full_name
                });
            }
            setEquipmentDialogOpen(true);
        } else {
            console.warn("No customer ID found for this booking dive");
        }
    };

    const handleGenerateInvoice = (bookingId: number) => {
        setSelectedBookingId(bookingId);
        setInvoiceDialogOpen(true);
    };

    const toggleSelection = (bookingId: number) => {
        setSelectedBookingIds(prev => 
            prev.includes(bookingId) 
                ? prev.filter(id => id !== bookingId) 
                : [...prev, bookingId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedBookingIds.length === filteredBookingDives.length) {
            setSelectedBookingIds([]);
        } else {
            const allFilteredIds = filteredBookingDives.map(bd => bd.booking_id);
            // Get unique booking IDs
            const uniqueIds = Array.from(new Set(allFilteredIds));
            setSelectedBookingIds(uniqueIds);
        }
    };

    const handleBulkInvoice = () => {
        if (selectedBookingIds.length === 0) return;
        setBulkInvoiceDialogOpen(true);
    };

    const getStatusVariant = (status?: string) => {
        switch (status) {
            case 'Completed':
                return 'default';
            case 'In Progress':
                return 'secondary';
            case 'Scheduled':
                return 'outline';
            case 'Cancelled':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const filteredBookingDives = bookingDives.filter(bookingDive => {
        // Search filter
        const matchesSearch = 
            bookingDive.booking?.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bookingDive.booking?.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bookingDive.booking?.dive_group?.group_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bookingDive.dive_site?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bookingDive.boat?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Status filter
        const matchesStatus = statusFilter === 'all' || bookingDive.status === statusFilter || (!bookingDive.status && statusFilter === 'Scheduled');
        
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Booking Dives" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Booking Dives</h2>
                    <div className="flex items-center space-x-2">
                        <Button onClick={() => router.push("/dashboard/booking-dives/create")}>
                            <Plus className="mr-2 h-4 w-4" /> Add Booking Dive
                        </Button>
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
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Scheduled">Scheduled</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Desktop Table View */}
                <div className="rounded-md border hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px]">
                                    <Checkbox 
                                        checked={selectedBookingIds.length > 0 && selectedBookingIds.length === Array.from(new Set(filteredBookingDives.map(bd => bd.booking_id))).length}
                                        onCheckedChange={toggleSelectAll}
                                    />
                                </TableHead>
                                <TableHead>Booking</TableHead>
                                <TableHead>Group</TableHead>
                                <TableHead>Dive Site</TableHead>
                                <TableHead>Boat</TableHead>
                                <TableHead>Dive Date</TableHead>
                                <TableHead>Dive Time</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Billed</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Max Depth</TableHead>
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
                                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
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
                                <TableRow key={bookingDive.id} data-state={selectedBookingIds.includes(bookingDive.booking_id) ? "selected" : undefined}>
                                        <TableCell>
                                            <Checkbox 
                                                checked={selectedBookingIds.includes(bookingDive.booking_id)}
                                                onCheckedChange={() => toggleSelection(bookingDive.booking_id)}
                                            />
                                        </TableCell>
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
                                        <TableCell>
                                            <Badge variant={getStatusVariant(bookingDive.status)}>
                                                {bookingDive.status || 'Scheduled'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {bookingDive.invoice_items_count && bookingDive.invoice_items_count > 0 ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200">
                                                    Yes
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground">
                                                    No
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {bookingDive.dive_duration ? (
                                                <span>{bookingDive.dive_duration} min</span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {bookingDive.max_depth ? (
                                                <div className="flex items-center gap-2">
                                                    <Gauge className="h-4 w-4 text-muted-foreground" />
                                                    {bookingDive.max_depth}m
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
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
                                                    <DropdownMenuItem onClick={() => handleViewEquipment(bookingDive)}>
                                                        <Package className="h-4 w-4 mr-2" />
                                                        View Equipment
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/booking-dives/${bookingDive.id}/edit`}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleGenerateInvoice(bookingDive.booking_id)}
                                                    >
                                                        <FileText className="h-4 w-4 mr-2" />
                                                        Generate Invoice
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
                            <Card key={bookingDive.id} className={selectedBookingIds.includes(bookingDive.booking_id) ? "border-primary bg-primary/5" : ""}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Checkbox 
                                                checked={selectedBookingIds.includes(bookingDive.booking_id)}
                                                onCheckedChange={() => toggleSelection(bookingDive.booking_id)}
                                            />
                                            <div>
                                                <CardDescription className="flex items-center gap-2 mb-1">
                                                    <Calendar className="h-4 w-4" />
                                                    Booking
                                                </CardDescription>
                                                <p className="font-medium">{bookingDive.booking?.customer?.full_name || `Booking #${bookingDive.booking_id}`}</p>
                                            </div>
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
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardDescription className="mb-1">Status</CardDescription>
                                            <Badge variant={getStatusVariant(bookingDive.status)} className="w-fit">
                                                {bookingDive.status || 'Scheduled'}
                                            </Badge>
                                        </div>
                                        <div className="text-right">
                                            <CardDescription className="mb-1">Billed</CardDescription>
                                            {bookingDive.invoice_items_count && bookingDive.invoice_items_count > 0 ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200">
                                                    Yes
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground">
                                                    No
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    {(bookingDive.dive_duration || bookingDive.max_depth) && (
                                        <div className="grid grid-cols-2 gap-4">
                                            {bookingDive.dive_duration && (
                                                <div>
                                                    <CardDescription className="mb-1">Duration</CardDescription>
                                                    <p className="text-sm font-medium">{bookingDive.dive_duration} min</p>
                                                </div>
                                            )}
                                            {bookingDive.max_depth && (
                                                <div>
                                                    <CardDescription className="mb-1 flex items-center gap-2">
                                                        <Gauge className="h-4 w-4" />
                                                        Max Depth
                                                    </CardDescription>
                                                    <p className="text-sm font-medium">{bookingDive.max_depth}m</p>
                                                </div>
                                            )}
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
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleGenerateInvoice(bookingDive.booking_id)}
                                        >
                                            <FileText className="h-4 w-4 mr-2" />
                                            Invoice
                                        </Button>
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
            
            {/* Invoice Generation Dialog */}
            {selectedBookingId && (
                <InvoiceGenerationDialog
                    open={invoiceDialogOpen}
                    onOpenChange={setInvoiceDialogOpen}
                    bookingId={selectedBookingId}
                />
            )}

            <Dialog open={equipmentDialogOpen} onOpenChange={setEquipmentDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Equipment Preparation</DialogTitle>
                        <DialogDescription>
                            View equipment requirements for the selected customer(s).
                        </DialogDescription>
                    </DialogHeader>
                    <EquipmentPreparationCard 
                        customerIds={selectedCustomerIds} 
                        customerNames={selectedCustomerNames}
                    />
                </DialogContent>
            </Dialog>

            {/* Bulk Action Bar */}
            <AnimatePresence>
                {selectedBookingIds.length > 0 && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] md:w-auto"
                    >
                        <div className="bg-primary text-primary-foreground px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 border border-primary-foreground/20">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-white/20 text-white border-none hover:bg-white/30">
                                    {selectedBookingIds.length}
                                </Badge>
                                <span className="text-sm font-medium whitespace-nowrap">Bookings Selected</span>
                            </div>
                            <div className="h-6 w-px bg-white/20" />
                            <div className="flex items-center gap-2">
                                <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    className="bg-white text-primary hover:bg-white/90 rounded-full h-9 px-4"
                                    onClick={handleBulkInvoice}
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Combine into Invoice
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-white hover:bg-white/10 rounded-full h-9"
                                    onClick={() => setSelectedBookingIds([])}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk Invoice Dialog */}
            <BulkInvoiceGenerationDialog 
                open={bulkInvoiceDialogOpen}
                onOpenChange={setBulkInvoiceDialogOpen}
                bookingIds={selectedBookingIds}
                onSuccess={() => setSelectedBookingIds([])}
            />
        </div>
    );
}

