"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, MoreHorizontal, Users } from "lucide-react";
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
import { relationshipService, Relationship, RelationshipFormData } from "@/lib/api/services/relationship.service";

const relationshipSchema = z.object({
    name: z.string().min(1, "Relationship name is required.").max(255, "Name must be less than 255 characters."),
});

export function RelationshipsList() {
    const [relationships, setRelationships] = useState<Relationship[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const form = useForm<RelationshipFormData>({
        resolver: zodResolver(relationshipSchema),
        defaultValues: {
            name: "",
        },
    });

    useEffect(() => {
        fetchRelationships();
    }, []);

    const fetchRelationships = async () => {
        try {
            setLoading(true);
            const data = await relationshipService.getAll();
            setRelationships(data);
        } catch (error) {
            console.error("Failed to fetch relationships", error);
            alert("Failed to load relationships.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (relationship?: Relationship) => {
        if (relationship) {
            setEditingRelationship(relationship);
            form.reset({ name: relationship.name });
        } else {
            setEditingRelationship(null);
            form.reset({ name: "" });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingRelationship(null);
        form.reset();
    };

    const onSubmit = async (data: RelationshipFormData) => {
        try {
            if (editingRelationship) {
                await relationshipService.update(editingRelationship.id, data);
                alert("Relationship updated successfully.");
            } else {
                await relationshipService.create(data);
                alert("Relationship added successfully.");
            }
            handleCloseDialog();
            fetchRelationships();
        } catch (error: any) {
            console.error("Failed to save relationship", error);
            const errorMessage = error.response?.data?.message || "Failed to save relationship.";
            alert(errorMessage);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this relationship?")) {
            return;
        }

        try {
            await relationshipService.delete(id);
            alert("Relationship deleted successfully.");
            const newTotalPages = Math.ceil((relationships.length - 1) / itemsPerPage);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }
            fetchRelationships();
        } catch (error: any) {
            console.error("Failed to delete relationship", error);
            const errorMessage = error.response?.data?.message || "Failed to delete relationship.";
            alert(errorMessage);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Relationships</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage relationship options for emergency contacts.
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Relationship
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingRelationship ? "Edit Relationship" : "Add Relationship"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingRelationship
                                    ? "Update the relationship name."
                                    : "Add a new relationship to the list."}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Relationship Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Spouse, Parent, Friend, etc." {...field} />
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
                                        {editingRelationship ? "Update" : "Add"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : relationships.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium">No relationships yet</h3>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                            Add your first relationship to get started.
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
                                {relationships
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((relationship) => (
                                        <TableRow key={relationship.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                                                        <Users className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-medium">{relationship.name}</span>
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
                                                        <DropdownMenuItem onClick={() => handleOpenDialog(relationship)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDelete(relationship.id)}
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
                        totalPages={Math.ceil(relationships.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={relationships.length}
                    />
                </>
            )}
        </div>
    );
}

