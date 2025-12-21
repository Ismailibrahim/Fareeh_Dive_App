"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, MoreHorizontal, Ruler } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { unitService, Unit, UnitFormData } from "@/lib/api/services/unit.service";

const unitSchema = z.object({
    name: z.string().min(1, "Unit name is required.").max(255, "Name must be less than 255 characters."),
});

export function UnitsList() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const form = useForm<UnitFormData>({
        resolver: zodResolver(unitSchema),
        defaultValues: {
            name: "",
        },
    });

    useEffect(() => {
        fetchUnits();
    }, []);

    const fetchUnits = async () => {
        try {
            setLoading(true);
            const data = await unitService.getAll();
            setUnits(data);
        } catch (error) {
            console.error("Failed to fetch units", error);
            alert("Failed to load units.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (unit?: Unit) => {
        if (unit) {
            setEditingUnit(unit);
            form.reset({ name: unit.name });
        } else {
            setEditingUnit(null);
            form.reset({ name: "" });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingUnit(null);
        form.reset();
    };

    const onSubmit = async (data: UnitFormData) => {
        try {
            if (editingUnit) {
                await unitService.update(editingUnit.id, data);
                alert("Unit updated successfully.");
            } else {
                await unitService.create(data);
                alert("Unit added successfully.");
            }
            handleCloseDialog();
            fetchUnits();
        } catch (error: any) {
            console.error("Failed to save unit", error);
            const errorMessage = error.response?.data?.message || "Failed to save unit.";
            alert(errorMessage);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this unit?")) {
            return;
        }

        try {
            await unitService.delete(id);
            alert("Unit deleted successfully.");
            const newTotalPages = Math.ceil((units.length - 1) / itemsPerPage);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }
            fetchUnits();
        } catch (error: any) {
            console.error("Failed to delete unit", error);
            const errorMessage = error.response?.data?.message || "Failed to delete unit.";
            alert(errorMessage);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Units</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage unit options for measurement and pricing.
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Unit
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingUnit ? "Edit Unit" : "Add Unit"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingUnit
                                    ? "Update the unit name."
                                    : "Add a new unit to the list."}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unit Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="kg, lbs, pcs, etc." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCloseDialog}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        {editingUnit ? "Update" : "Add"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : units.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                            <Ruler className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium">No units yet</h3>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                            Add your first unit to get started.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {units
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((unit) => (
                                        <TableRow key={unit.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                                                        <Ruler className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-medium">{unit.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleOpenDialog(unit)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDelete(unit.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(units.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={units.length}
                    />
                </>
            )}
        </div>
    );
}

