"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, MoreHorizontal, MapPin } from "lucide-react";
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
import { islandService, Island, IslandFormData } from "@/lib/api/services/island.service";

const islandSchema = z.object({
    name: z.string().min(1, "Island name is required.").max(255, "Name must be less than 255 characters."),
});

export function IslandsList() {
    const [islands, setIslands] = useState<Island[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingIsland, setEditingIsland] = useState<Island | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const form = useForm<IslandFormData>({
        resolver: zodResolver(islandSchema),
        defaultValues: {
            name: "",
        },
    });

    useEffect(() => {
        fetchIslands();
    }, []);

    const fetchIslands = async () => {
        try {
            setLoading(true);
            const data = await islandService.getAll();
            setIslands(data);
        } catch (error) {
            console.error("Failed to fetch islands", error);
            alert("Failed to load islands.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (island?: Island) => {
        if (island) {
            setEditingIsland(island);
            form.reset({ name: island.name });
        } else {
            setEditingIsland(null);
            form.reset({ name: "" });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingIsland(null);
        form.reset();
    };

    const onSubmit = async (data: IslandFormData) => {
        try {
            if (editingIsland) {
                await islandService.update(editingIsland.id, data);
                alert("Island updated successfully.");
            } else {
                await islandService.create(data);
                alert("Island added successfully.");
            }
            handleCloseDialog();
            fetchIslands();
        } catch (error: any) {
            console.error("Failed to save island", error);
            const errorMessage = error.response?.data?.message || "Failed to save island.";
            alert(errorMessage);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this island?")) {
            return;
        }

        try {
            await islandService.delete(id);
            alert("Island deleted successfully.");
            const newTotalPages = Math.ceil((islands.length - 1) / itemsPerPage);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }
            fetchIslands();
        } catch (error: any) {
            console.error("Failed to delete island", error);
            const errorMessage = error.response?.data?.message || "Failed to delete island.";
            alert(errorMessage);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Islands</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage island options for locations and bookings.
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Island
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingIsland ? "Edit Island" : "Add Island"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingIsland
                                    ? "Update the island name."
                                    : "Add a new island to the list."}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Island Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Malé, Hulhumalé, etc." {...field} />
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
                                        {editingIsland ? "Update" : "Add"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : islands.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium">No islands yet</h3>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                            Add your first island to get started.
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
                                {islands
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((island) => (
                                        <TableRow key={island.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                                                        <MapPin className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-medium">{island.name}</span>
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
                                                        <DropdownMenuItem onClick={() => handleOpenDialog(island)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDelete(island.id)}
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
                        totalPages={Math.ceil(islands.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={islands.length}
                    />
                </>
            )}
        </div>
    );
}

