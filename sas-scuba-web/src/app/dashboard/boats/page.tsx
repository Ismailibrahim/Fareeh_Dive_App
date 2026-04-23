"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Boat, boatService } from "@/lib/api/services/boat.service";
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
import { Search, MoreHorizontal, Ship, Plus, Database, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
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
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BoatsPage() {
    const [boats, setBoats] = useState<Boat[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [boatToDelete, setBoatToDelete] = useState<Boat | null>(null);

    const fetchBoats = async () => {
        setLoading(true);
        try {
            const data = await boatService.getAll();
            const boatsList = Array.isArray(data) ? data : (data as any).data || [];
            setBoats(boatsList);
        } catch (error) {
            console.error("Failed to fetch boats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoats();
    }, []);

    // Refresh data when page comes into focus (e.g., when navigating back from edit page)
    useEffect(() => {
        const handleFocus = () => {
            fetchBoats();
        };
        
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const handleDeleteClick = (boat: Boat) => {
        setBoatToDelete(boat);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!boatToDelete) return;
        try {
            await boatService.delete(boatToDelete.id);
            setBoats(boats.filter(b => b.id !== boatToDelete.id));
        } catch (error) {
            console.error("Failed to delete boat", error);
        } finally {
            setDeleteDialogOpen(false);
            setBoatToDelete(null);
        }
    };

    const filteredBoats = boats.filter(boat =>
        boat.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Boats" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Boats</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/boats/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Boat
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search boats..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="rounded-md border hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Capacities</TableHead>
                                <TableHead>Ownership</TableHead>
                                <TableHead>Rental Period</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Skeleton className="h-4 w-4" />
                                                    <Skeleton className="h-4 w-32" />
                                                </div>
                                            </TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                            <TableCell className="text-right">
                                                <Skeleton className="h-8 w-8 ml-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </>
                            ) : filteredBoats.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No boats found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBoats.map((boat) => (
                                    <TableRow key={boat.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Ship className="h-4 w-4 text-muted-foreground" />
                                                {boat.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {boat.capacity ? `${boat.capacity} divers` : "-"}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                    <Database className="h-3.5 w-3.5" />
                                                    {boat.tank_capacity ? `${boat.tank_capacity} tanks` : "-"}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={boat.ownership_type === "Owned" ? "default" : "outline"}>
                                                {boat.ownership_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {boat.ownership_type === "Rented" ? (
                                                <div className="flex flex-col gap-0.5 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {boat.rent_start_date ? format(new Date(boat.rent_start_date), "MMM d, yyyy") : "N/A"}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        {boat.rent_end_date ? format(new Date(boat.rent_end_date), "MMM d, yyyy") : "N/A"}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">N/A</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <Badge variant={boat.active && !boat.is_rental_expired ? "default" : "secondary"}>
                                                    {boat.active && !boat.is_rental_expired ? "Active" : "Inactive"}
                                                </Badge>
                                                {boat.is_rental_expired && (
                                                    <Badge variant="destructive" className="text-[10px] py-0 h-4">
                                                        Rental Expired
                                                    </Badge>
                                                )}
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
                                                    <BoatActions
                                                        boatId={boat.id}
                                                        onDelete={() => handleDeleteClick(boat)}
                                                    />
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
                                <Card key={i} className="p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Skeleton className="h-6 w-16" />
                                        <Skeleton className="h-6 w-16" />
                                    </div>
                                </Card>
                            ))}
                        </>
                    ) : filteredBoats.length === 0 ? (
                        <div className="text-center p-4 border rounded-md bg-muted/50">No boats found.</div>
                    ) : (
                        filteredBoats.map((boat) => (
                            <Card key={boat.id} className="p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Ship className="h-5 w-5 text-primary" />
                                        <div>
                                            <h3 className="font-semibold leading-none tracking-tight">{boat.name}</h3>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <BoatActions
                                                boatId={boat.id}
                                                onDelete={() => handleDeleteClick(boat)}
                                            />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Person Capacity</span>
                                        <span>{boat.capacity ? `${boat.capacity} divers` : "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Tank Capacity</span>
                                        <span>{boat.tank_capacity ? `${boat.tank_capacity} tanks` : "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Ownership</span>
                                        <Badge variant={boat.ownership_type === "Owned" ? "default" : "outline"}>
                                            {boat.ownership_type}
                                        </Badge>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Status</span>
                                        <div className="flex flex-col gap-1">
                                            <Badge variant={boat.active && !boat.is_rental_expired ? "default" : "secondary"} className="w-fit">
                                                {boat.active && !boat.is_rental_expired ? "Active" : "Inactive"}
                                            </Badge>
                                            {boat.is_rental_expired && (
                                                <Badge variant="destructive" className="w-fit text-[10px]">
                                                    Rental Expired
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    {boat.ownership_type === "Rented" && (
                                        <div className="col-span-2 pt-1 border-t border-dashed">
                                            <span className="text-muted-foreground block text-xs mb-1">Rental Period</span>
                                            <div className="flex items-center gap-4 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {boat.rent_start_date ? format(new Date(boat.rent_start_date), "MMM d") : "?"}
                                                </div>
                                                <span>to</span>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {boat.rent_end_date ? format(new Date(boat.rent_end_date), "MMM d, yyyy") : "?"}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the boat
                            <strong> {boatToDelete?.name} </strong>
                            and remove it from the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function BoatActions({ boatId, onDelete }: { boatId: number | string, onDelete: () => void }) {
    return (
        <>
            <DropdownMenuItem asChild>
                <Link href={`/dashboard/boats/${boatId}/edit`} className="cursor-pointer flex w-full items-center">
                    Edit
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                onSelect={(e) => {
                    e.preventDefault();
                    onDelete();
                }}
            >
                Delete
            </DropdownMenuItem>
        </>
    );
}

