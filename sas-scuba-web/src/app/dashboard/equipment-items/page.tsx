"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { EquipmentItem, equipmentItemService, PaginatedResponse } from "@/lib/api/services/equipment-item.service";
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
import { Search, MoreHorizontal, Package, Plus, Calendar, AlertTriangle, Layers } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
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

export default function EquipmentItemsPage() {
    const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        per_page: 20,
        last_page: 1,
        current_page: 1,
    });

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<EquipmentItem | null>(null);

    const fetchEquipmentItems = useCallback(async (page = 1, search = "") => {
        setLoading(true);
        try {
            const response = await equipmentItemService.getAll({
                page,
                per_page: 20,
                search: search || undefined,
            });
            
            // Handle Laravel pagination response
            if (response.data && Array.isArray(response.data)) {
                setEquipmentItems(response.data);
                setPagination({
                    total: response.total || 0,
                    per_page: response.per_page || 20,
                    last_page: response.last_page || 1,
                    current_page: response.current_page || page,
                });
            } else {
                // Fallback for non-paginated response
                const itemsList = Array.isArray(response) ? response : (response as any).data || [];
                setEquipmentItems(itemsList);
            }
        } catch (error) {
            console.error("Failed to fetch equipment items", error);
            setEquipmentItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchEquipmentItems(1, "");
    }, [fetchEquipmentItems]);

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setCurrentPage(1);
            fetchEquipmentItems(1, searchTerm);
        }, 300); // 300ms debounce
        
        return () => clearTimeout(timeoutId);
    }, [searchTerm, fetchEquipmentItems]);

    // Refresh data when page comes into focus (e.g., when navigating back from edit page)
    useEffect(() => {
        const handleFocus = () => {
            fetchEquipmentItems(currentPage, searchTerm);
        };
        
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [currentPage, searchTerm, fetchEquipmentItems]);

    const handleDeleteClick = (item: EquipmentItem) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await equipmentItemService.delete(itemToDelete.id);
            // Refresh current page after delete
            fetchEquipmentItems(currentPage, searchTerm);
        } catch (error) {
            console.error("Failed to delete equipment item", error);
        } finally {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Available':
                return 'default';
            case 'Rented':
                return 'secondary';
            case 'Maintenance':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Equipment Items" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Equipment Items</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/equipment-items/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Equipment Item
                            </Button>
                        </Link>
                        <Link href="/dashboard/equipment-items/bulk-create">
                            <Button variant="outline">
                                <Layers className="mr-2 h-4 w-4" /> Bulk Create
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search equipment items..."
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
                                <TableHead className="w-16">Image</TableHead>
                                <TableHead>Equipment</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Serial Number</TableHead>
                                <TableHead>Inventory Code</TableHead>
                                <TableHead>Brand</TableHead>
                                <TableHead>Purchase Date</TableHead>
                                <TableHead>Last Service</TableHead>
                                <TableHead>Next Service Due</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : equipmentItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="h-24 text-center">
                                        No equipment items found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                equipmentItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            {item.image_url ? (
                                                <div className="relative w-12 h-12 rounded-md overflow-hidden border border-border">
                                                    <Image
                                                        src={item.image_url}
                                                        alt={item.equipment?.name || 'Equipment'}
                                                        fill
                                                        className="object-cover"
                                                        sizes="48px"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-md border border-border bg-muted flex items-center justify-center">
                                                    <Package className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {item.equipment?.name || 'Unknown'}
                                                {item.equipment?.category && (
                                                    <span className="text-muted-foreground text-sm">({item.equipment.category})</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {item.size || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {item.serial_no || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {item.inventory_code || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {item.brand || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {item.purchase_date ? format(new Date(item.purchase_date), "MMM d, yyyy") : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {item.last_service_date ? format(new Date(item.last_service_date), "MMM d, yyyy") : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {item.next_service_date ? (
                                                <div className="flex items-center gap-2">
                                                    {new Date(item.next_service_date) <= new Date() && item.requires_service ? (
                                                        <AlertTriangle className="h-4 w-4 text-destructive" />
                                                    ) : (
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                    <span className={new Date(item.next_service_date) <= new Date() && item.requires_service ? "text-destructive font-medium" : ""}>
                                                        {format(new Date(item.next_service_date), "MMM d, yyyy")}
                                                    </span>
                                                </div>
                                            ) : item.requires_service ? (
                                                <span className="text-muted-foreground">Not set</span>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(item.status)}>
                                                {item.status}
                                            </Badge>
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
                                                    <EquipmentItemActions
                                                        itemId={item.id}
                                                        onDelete={() => handleDeleteClick(item)}
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

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="flex justify-center">
                        <Pagination
                            currentPage={pagination.current_page}
                            totalPages={pagination.last_page}
                            onPageChange={(page) => {
                                setCurrentPage(page);
                                fetchEquipmentItems(page, searchTerm);
                            }}
                            itemsPerPage={pagination.per_page}
                            totalItems={pagination.total}
                        />
                    </div>
                )}

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {loading ? (
                        <div className="text-center p-4">Loading...</div>
                    ) : equipmentItems.length === 0 ? (
                        <div className="text-center p-4 border rounded-md bg-muted/50">No equipment items found.</div>
                    ) : (
                        equipmentItems.map((item) => (
                            <div key={item.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        {item.image_url ? (
                                            <div className="relative w-16 h-16 rounded-md overflow-hidden border border-border flex-shrink-0">
                                                <Image
                                                    src={item.image_url}
                                                    alt={item.equipment?.name || 'Equipment'}
                                                    fill
                                                    className="object-cover"
                                                    sizes="64px"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 rounded-md border border-border bg-muted flex items-center justify-center flex-shrink-0">
                                                <Package className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-semibold leading-none tracking-tight">
                                                {item.equipment?.name || 'Unknown'}
                                            </h3>
                                            {item.equipment?.category && (
                                                <p className="text-sm text-muted-foreground mt-1">{item.equipment.category}</p>
                                            )}
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <EquipmentItemActions
                                                itemId={item.id}
                                                onDelete={() => handleDeleteClick(item)}
                                            />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Size</span>
                                        <span>{item.size || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Serial No</span>
                                        <span>{item.serial_no || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Inventory Code</span>
                                        <span>{item.inventory_code || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Brand</span>
                                        <span>{item.brand || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Purchase Date</span>
                                        <span>{item.purchase_date ? format(new Date(item.purchase_date), "MMM d, yyyy") : "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Last Service</span>
                                        <span>{item.last_service_date ? format(new Date(item.last_service_date), "MMM d, yyyy") : "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Next Service Due</span>
                                        {item.next_service_date ? (
                                            <span className={new Date(item.next_service_date) <= new Date() && item.requires_service ? "text-destructive font-medium" : ""}>
                                                {format(new Date(item.next_service_date), "MMM d, yyyy")}
                                            </span>
                                        ) : item.requires_service ? (
                                            <span className="text-muted-foreground">Not set</span>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-muted-foreground block text-xs">Status</span>
                                        <Badge variant={getStatusVariant(item.status)}>
                                            {item.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this equipment item
                            {itemToDelete?.equipment?.name && (
                                <> for <strong>{itemToDelete.equipment.name}</strong></>
                            )}
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

function EquipmentItemActions({ itemId, onDelete }: { itemId: number | string, onDelete: () => void }) {
    return (
        <>
            <DropdownMenuItem asChild>
                <Link href={`/dashboard/equipment-items/${itemId}/edit`} className="cursor-pointer flex w-full items-center">
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

