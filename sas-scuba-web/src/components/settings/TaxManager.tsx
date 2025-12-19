"use client";

import { useState, useEffect } from "react";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { taxService, Tax, TaxFormData } from "@/lib/api/services/tax.service";
import { Plus, Pencil, Trash2, Percent } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
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

const taxSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
    percentage: z.number().min(0, "Percentage must be 0 or greater").max(100, "Percentage cannot exceed 100"),
});


export function TaxManager() {
    const [taxes, setTaxes] = useState<Tax[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTax, setEditingTax] = useState<Tax | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [taxToDelete, setTaxToDelete] = useState<Tax | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const form = useForm<TaxFormData>({
        resolver: zodResolver(taxSchema),
        defaultValues: {
            name: "",
            percentage: 0,
        },
    });

    useEffect(() => {
        fetchTaxes();
    }, []);


    const fetchTaxes = async () => {
        try {
            setLoading(true);
            const data = await taxService.getAll();
            setTaxes(data);
        } catch (error) {
            console.error("Failed to fetch taxes", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingTax(null);
        form.reset({ name: "", percentage: 0 });
        setDialogOpen(true);
    };

    const handleEdit = (tax: Tax) => {
        setEditingTax(tax);
        form.reset({ name: tax.name, percentage: tax.percentage });
        setDialogOpen(true);
    };

    const handleDeleteClick = (tax: Tax) => {
        setTaxToDelete(tax);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!taxToDelete) return;

        setDeleting(true);
        try {
            await taxService.delete(taxToDelete.id);
            const newTotalPages = Math.ceil((taxes.length - 1) / itemsPerPage);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }
            await fetchTaxes();
            setDeleteDialogOpen(false);
            setTaxToDelete(null);
        } catch (error) {
            console.error("Failed to delete tax", error);
        } finally {
            setDeleting(false);
        }
    };

    const onSubmit = async (data: TaxFormData) => {
        try {
            if (editingTax) {
                await taxService.update(editingTax.id, data);
            } else {
                await taxService.create(data);
            }
            setDialogOpen(false);
            form.reset();
            await fetchTaxes();
        } catch (error: any) {
            console.error("Failed to save tax", error);
            const errorMessage = error.response?.data?.message || "Failed to save tax.";
            alert(errorMessage);
        }
    };

    // Calculate pagination
    const totalPages = Math.ceil(taxes.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTaxes = taxes.slice(startIndex, endIndex);

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Tax, Commission & Service Charge</h3>
                        <p className="text-sm text-muted-foreground">
                            Manage tax rates, commission percentages, and service charges.
                        </p>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (open && !editingTax) {
                            form.reset({ name: "", percentage: 0 });
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add New
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingTax ? "Edit Type" : "Add New Type"}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingTax
                                        ? "Update the type name and percentage."
                                        : "Enter a type name and percentage."}
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Tax, Commission, Service Charge" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="percentage"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Percentage (%)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            max="100"
                                                            placeholder="0.00"
                                                            className="pl-9"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                            value={field.value || ""}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit">
                                            {editingTax ? "Update" : "Add"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : taxes.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center bg-slate-50/50 dark:bg-slate-900/20">
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                                <Percent className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-medium">No taxes configured</h3>
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                Add your first tax, commission, or service charge to get started.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type Name</TableHead>
                                        <TableHead>Percentage</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedTaxes.map((tax) => (
                                        <TableRow key={tax.id}>
                                            <TableCell className="font-medium">{tax.name}</TableCell>
                                            <TableCell>{Number(tax.percentage).toFixed(2)}%</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(tax)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteClick(tax)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                itemsPerPage={itemsPerPage}
                                totalItems={taxes.length}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{taxToDelete?.name}" ({taxToDelete?.percentage}%). This action cannot be undone.
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

