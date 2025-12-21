"use client";

import React, { useState, useEffect } from "react";
import { PriceListItem } from "@/lib/api/services/price-list.service";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils/currency";
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
import { priceListItemService } from "@/lib/api/services/price-list-item.service";

interface PriceListItemTableProps {
    items: PriceListItem[];
    baseCurrency?: string;
    onItemUpdated: () => void;
    onEditItem: (item: PriceListItem) => void;
    selectedItems?: number[];
    onSelectionChange?: (selectedIds: number[]) => void;
}

export function PriceListItemTable({ 
    items, 
    baseCurrency = "USD", 
    onItemUpdated, 
    onEditItem,
    selectedItems = [],
    onSelectionChange
}: PriceListItemTableProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<PriceListItem | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [internalSelectedItems, setInternalSelectedItems] = useState<number[]>(selectedItems);

    // Sync internal state with prop
    useEffect(() => {
        setInternalSelectedItems(selectedItems);
    }, [selectedItems]);

    const handleSelectItem = (itemId: number, checked: boolean) => {
        let newSelection: number[];
        if (checked) {
            newSelection = [...internalSelectedItems, itemId];
        } else {
            newSelection = internalSelectedItems.filter(id => id !== itemId);
        }
        setInternalSelectedItems(newSelection);
        onSelectionChange?.(newSelection);
    };

    const handleSelectAll = (checked: boolean) => {
        const newSelection = checked ? items.map(item => item.id) : [];
        setInternalSelectedItems(newSelection);
        onSelectionChange?.(newSelection);
    };

    const allSelected = items.length > 0 && internalSelectedItems.length === items.length;
    const someSelected = internalSelectedItems.length > 0 && internalSelectedItems.length < items.length;

    const handleDeleteClick = (item: PriceListItem) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;

        setDeleting(true);
        try {
            await priceListItemService.delete(itemToDelete.id);
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            onItemUpdated();
        } catch (error) {
            console.error("Failed to delete item", error);
        } finally {
            setDeleting(false);
        }
    };


    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                                    onCheckedChange={(checked) => handleSelectAll(checked === true)}
                                    aria-label="Select all items"
                                />
                            </TableHead>
                            <TableHead>Service Type</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Tax %</TableHead>
                            <TableHead>Tax Inc.</TableHead>
                            <TableHead>Svc Chg Inc.</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                                    No items in price list. Click "Add Item" to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={internalSelectedItems.includes(item.id)}
                                            onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                                            aria-label={`Select ${item.name}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{item.service_type}</TableCell>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="max-w-[300px] truncate">
                                        {item.description || "-"}
                                    </TableCell>
                                    <TableCell>{formatPrice(item.price, baseCurrency)}</TableCell>
                                    <TableCell>{item.unit || "-"}</TableCell>
                                    <TableCell>{item.tax_percentage ? `${item.tax_percentage}%` : "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.tax_inclusive ? "default" : "outline"}>
                                            {item.tax_inclusive ? "Yes" : "No"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={item.service_charge_inclusive ? "default" : "outline"}>
                                            {item.service_charge_inclusive ? "Yes" : "No"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={item.is_active ? "default" : "secondary"}>
                                            {item.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEditItem(item)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteClick(item)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
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

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the price list item "{itemToDelete?.name}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

