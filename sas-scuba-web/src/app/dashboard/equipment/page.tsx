"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Equipment, equipmentService, PaginatedResponse } from "@/lib/api/services/equipment.service";
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
import { Badge } from "@/components/ui/badge";
import { Search, MoreHorizontal, Package, Plus, Tag, Edit, Trash2, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function EquipmentPage() {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
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
    const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);

    const fetchEquipment = useCallback(async (page = 1, search = "") => {
        setLoading(true);
        try {
            const response = await equipmentService.getAll({
                page,
                per_page: 20,
                search: search || undefined,
            });
            
            // Handle Laravel pagination response
            if (response.data && Array.isArray(response.data)) {
                setEquipment(response.data);
                setPagination({
                    total: response.total || 0,
                    per_page: response.per_page || 20,
                    last_page: response.last_page || 1,
                    current_page: response.current_page || page,
                });
            } else {
                // Fallback for non-paginated response
                const equipmentList = Array.isArray(response) ? response : (response as any).data || [];
                setEquipment(equipmentList);
            }
        } catch (error) {
            console.error("Failed to fetch equipment", error);
            setEquipment([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchEquipment(1, "");
    }, [fetchEquipment]);

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setCurrentPage(1);
            fetchEquipment(1, searchTerm);
        }, 300); // 300ms debounce
        
        return () => clearTimeout(timeoutId);
    }, [searchTerm, fetchEquipment]);

    // Refresh data when page comes into focus (e.g., when navigating back from edit page)
    useEffect(() => {
        const handleFocus = () => {
            fetchEquipment(currentPage, searchTerm);
        };
        
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [currentPage, searchTerm, fetchEquipment]);

    const handleDeleteClick = (item: Equipment) => {
        setEquipmentToDelete(item);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!equipmentToDelete) return;
        try {
            await equipmentService.delete(equipmentToDelete.id);
            // Refresh current page after delete
            fetchEquipment(currentPage, searchTerm);
        } catch (error) {
            console.error("Failed to delete equipment", error);
        } finally {
            setDeleteDialogOpen(false);
            setEquipmentToDelete(null);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Equipment" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Equipment</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/equipment/bulk-create">
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" /> Bulk Create
                            </Button>
                        </Link>
                        <Link href="/dashboard/equipment/import">
                            <Button variant="outline">
                                <FileSpreadsheet className="mr-2 h-4 w-4" /> Import Excel
                            </Button>
                        </Link>
                        <Link href="/dashboard/equipment/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Equipment
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search equipment..."
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
                                <TableHead className="font-semibold">Name</TableHead>
                                <TableHead className="font-semibold">Category</TableHead>
                                <TableHead className="font-semibold">Sizes</TableHead>
                                <TableHead className="font-semibold">Brands</TableHead>
                                <TableHead className="font-semibold">Items</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                            <span>Loading equipment...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : equipment.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                            <Package className="h-8 w-8" />
                                            <div>
                                                <p className="font-medium">No equipment found</p>
                                                <p className="text-sm">
                                                    {searchTerm ? "Try adjusting your search." : "Get started by adding your first equipment."}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                equipment.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-muted-foreground" />
                                                {item.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {item.category ? (
                                                <Badge variant="outline" className="font-normal">
                                                    <Tag className="mr-1 h-3 w-3" />
                                                    {item.category}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {item.sizes && item.sizes.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {item.sizes.map((size) => (
                                                        <Badge key={size} variant="secondary" className="text-xs">
                                                            {size}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {item.brands && item.brands.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {item.brands.map((brand) => (
                                                        <Badge key={brand} variant="secondary" className="text-xs">
                                                            {brand}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-normal">
                                                {item.equipment_items?.length || 0} {item.equipment_items?.length === 1 ? 'item' : 'items'}
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
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <EquipmentActions
                                                        equipmentId={item.id}
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
                    {pagination.last_page > 1 && (
                        <Pagination
                            currentPage={pagination.current_page}
                            totalPages={pagination.last_page}
                            onPageChange={(page) => {
                                setCurrentPage(page);
                                fetchEquipment(page, searchTerm);
                            }}
                            itemsPerPage={pagination.per_page}
                            totalItems={pagination.total}
                        />
                    )}
                </div>

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {loading ? (
                        <div className="text-center p-4">Loading...</div>
                    ) : equipment.length === 0 ? (
                        <div className="text-center p-4 border rounded-md bg-muted/50">No equipment found.</div>
                    ) : (
                        equipment.map((item) => (
                            <div key={item.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Package className="h-5 w-5 text-primary" />
                                        <div>
                                            <h3 className="font-semibold leading-none tracking-tight">{item.name}</h3>
                                            <div className="mt-1">
                                                {item.category ? (
                                                    <Badge variant="outline" className="text-xs">
                                                        <Tag className="mr-1 h-3 w-3" />
                                                        {item.category}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">No category</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <EquipmentActions
                                                equipmentId={item.id}
                                                onDelete={() => handleDeleteClick(item)}
                                            />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="text-sm space-y-2">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Sizes</span>
                                        {item.sizes && item.sizes.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {item.sizes.map((size) => (
                                                    <Badge key={size} variant="secondary" className="text-xs">
                                                        {size}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">No sizes</span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Brands</span>
                                        {item.brands && item.brands.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {item.brands.map((brand) => (
                                                    <Badge key={brand} variant="secondary" className="text-xs">
                                                        {brand}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">No brands</span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Items</span>
                                        <span>{item.equipment_items?.length || 0} items</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    {pagination.last_page > 1 && (
                        <Pagination
                            currentPage={pagination.current_page}
                            totalPages={pagination.last_page}
                            onPageChange={(page) => {
                                setCurrentPage(page);
                                fetchEquipment(page, searchTerm);
                            }}
                            itemsPerPage={pagination.per_page}
                            totalItems={pagination.total}
                        />
                    )}
                </div>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the equipment
                            <strong> {equipmentToDelete?.name} </strong>
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

function EquipmentActions({ equipmentId, onDelete }: { equipmentId: number | string, onDelete: () => void }) {
    return (
        <>
            <DropdownMenuItem asChild>
                <Link href={`/dashboard/equipment/${equipmentId}/edit`} className="cursor-pointer flex w-full items-center">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950"
                onSelect={(e) => {
                    e.preventDefault();
                    onDelete();
                }}
            >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
            </DropdownMenuItem>
        </>
    );
}

