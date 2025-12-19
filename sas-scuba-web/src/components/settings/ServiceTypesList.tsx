"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, MoreHorizontal, Tag } from "lucide-react";
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
import { serviceTypeService, ServiceType, ServiceTypeFormData } from "@/lib/api/services/service-type.service";

const serviceTypeSchema = z.object({
    name: z.string().min(1, "Service type name is required.").max(255, "Name must be less than 255 characters."),
});

export function ServiceTypesList() {
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const form = useForm<ServiceTypeFormData>({
        resolver: zodResolver(serviceTypeSchema),
        defaultValues: {
            name: "",
        },
    });

    useEffect(() => {
        fetchServiceTypes();
    }, []);

    const fetchServiceTypes = async () => {
        try {
            setLoading(true);
            const data = await serviceTypeService.getAll();
            setServiceTypes(data);
        } catch (error) {
            console.error("Failed to fetch service types", error);
            alert("Failed to load service types.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (serviceType?: ServiceType) => {
        if (serviceType) {
            setEditingServiceType(serviceType);
            form.reset({ name: serviceType.name });
        } else {
            setEditingServiceType(null);
            form.reset({ name: "" });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingServiceType(null);
        form.reset();
    };

    const onSubmit = async (data: ServiceTypeFormData) => {
        try {
            if (editingServiceType) {
                await serviceTypeService.update(editingServiceType.id, data);
                alert("Service type updated successfully.");
            } else {
                await serviceTypeService.create(data);
                alert("Service type added successfully.");
            }
            handleCloseDialog();
            fetchServiceTypes();
        } catch (error: any) {
            console.error("Failed to save service type", error);
            const errorMessage = error.response?.data?.message || "Failed to save service type.";
            alert(errorMessage);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this service type?")) {
            return;
        }

        try {
            await serviceTypeService.delete(id);
            alert("Service type deleted successfully.");
            const newTotalPages = Math.ceil((serviceTypes.length - 1) / itemsPerPage);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }
            fetchServiceTypes();
        } catch (error: any) {
            console.error("Failed to delete service type", error);
            const errorMessage = error.response?.data?.message || "Failed to delete service type.";
            alert(errorMessage);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Service Types</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage service type options for price list items.
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Service Type
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingServiceType ? "Edit Service Type" : "Add Service Type"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingServiceType
                                    ? "Update the service type name."
                                    : "Add a new service type to the list."}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Service Type Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Dive Course, Dive Trip" {...field} />
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
                                        {editingServiceType ? "Update" : "Add"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : serviceTypes.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium">No service types yet</h3>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                            Add your first service type to get started.
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
                                {serviceTypes
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((serviceType) => (
                                        <TableRow key={serviceType.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                                                        <Tag className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-medium">{serviceType.name}</span>
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
                                                        <DropdownMenuItem onClick={() => handleOpenDialog(serviceType)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDelete(serviceType.id)}
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
                        totalPages={Math.ceil(serviceTypes.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={serviceTypes.length}
                    />
                </>
            )}
        </div>
    );
}

