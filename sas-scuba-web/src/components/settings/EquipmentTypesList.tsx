"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, MoreHorizontal, Waves } from "lucide-react";
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
import { equipmentTypeService, EquipmentType, EquipmentTypeFormData } from "@/lib/api/services/equipment-type.service";

const equipmentTypeSchema = z.object({
    name: z.string().min(1, "Name is required.").max(255, "Name must be less than 255 characters."),
});

export function EquipmentTypesList() {
    const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<EquipmentType | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const form = useForm<EquipmentTypeFormData>({
        resolver: zodResolver(equipmentTypeSchema),
        defaultValues: {
            name: "",
        },
    });

    useEffect(() => {
        fetchEquipmentTypes();
    }, []);

    const fetchEquipmentTypes = async () => {
        try {
            setLoading(true);
            const data = await equipmentTypeService.getAll();
            setEquipmentTypes(data);
        } catch (error) {
            console.error("Failed to fetch equipment types", error);
            alert("Failed to load equipment types.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (type?: EquipmentType) => {
        if (type) {
            setEditingType(type);
            form.reset({ name: type.name });
        } else {
            setEditingType(null);
            form.reset({ name: "" });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingType(null);
        form.reset();
    };

    const onSubmit = async (data: EquipmentTypeFormData) => {
        try {
            if (editingType) {
                await equipmentTypeService.update(editingType.id, data);
                alert("Equipment type updated successfully.");
            } else {
                await equipmentTypeService.create(data);
                alert("Equipment type added successfully.");
            }
            handleCloseDialog();
            fetchEquipmentTypes();
        } catch (error: any) {
            console.error("Failed to save equipment type", error);
            const errorMessage = error.response?.data?.message || "Failed to save equipment type.";
            alert(errorMessage);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this equipment type?")) {
            return;
        }

        try {
            await equipmentTypeService.delete(id);
            alert("Equipment type deleted successfully.");
            const newTotalPages = Math.ceil((equipmentTypes.length - 1) / itemsPerPage);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }
            fetchEquipmentTypes();
        } catch (error: any) {
            console.error("Failed to delete equipment type", error);
            const errorMessage = error.response?.data?.message || "Failed to delete equipment type.";
            alert(errorMessage);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Equipment Item List</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage equipment types that customers can request.
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Equipment Type
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingType ? "Edit Equipment Type" : "Add Equipment Type"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingType
                                    ? "Update the equipment type name."
                                    : "Add a new equipment type to the list (e.g. BCD, Dive Computer)."}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Equipment Type Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. BCD, Regulator, Wetsuit" {...field} />
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
                                        {editingType ? "Update" : "Add"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : equipmentTypes.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                            <Waves className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium">No equipment types yet</h3>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                            Add your first equipment type to get started.
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
                                {equipmentTypes
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((type) => (
                                        <TableRow key={type.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                                                        <Waves className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-medium">{type.name}</span>
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
                                                        <DropdownMenuItem onClick={() => handleOpenDialog(type)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDelete(type.id)}
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
                        totalPages={Math.ceil(equipmentTypes.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={equipmentTypes.length}
                    />
                </>
            )}
        </div>
    );
}
