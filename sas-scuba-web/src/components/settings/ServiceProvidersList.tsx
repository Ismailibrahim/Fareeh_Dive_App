"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, MoreHorizontal, Wrench } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { serviceProviderService, ServiceProvider, ServiceProviderFormData } from "@/lib/api/services/service-provider.service";

const serviceProviderSchema = z.object({
    name: z.string().min(1, "Service provider name is required.").max(255, "Name must be less than 255 characters."),
    address: z.string().optional(),
    contact_no: z.string().optional(),
});

export function ServiceProvidersList() {
    const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingServiceProvider, setEditingServiceProvider] = useState<ServiceProvider | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const form = useForm<ServiceProviderFormData>({
        resolver: zodResolver(serviceProviderSchema),
        defaultValues: {
            name: "",
            address: "",
            contact_no: "",
        },
    });

    useEffect(() => {
        fetchServiceProviders();
    }, []);

    const fetchServiceProviders = async () => {
        try {
            setLoading(true);
            const data = await serviceProviderService.getAll();
            setServiceProviders(data);
        } catch (error) {
            console.error("Failed to fetch service providers", error);
            alert("Failed to load service providers.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (serviceProvider?: ServiceProvider) => {
        if (serviceProvider) {
            setEditingServiceProvider(serviceProvider);
            form.reset({
                name: serviceProvider.name,
                address: serviceProvider.address || "",
                contact_no: serviceProvider.contact_no || "",
            });
        } else {
            setEditingServiceProvider(null);
            form.reset({
                name: "",
                address: "",
                contact_no: "",
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingServiceProvider(null);
        form.reset();
    };

    const onSubmit = async (data: ServiceProviderFormData) => {
        try {
            if (editingServiceProvider) {
                await serviceProviderService.update(editingServiceProvider.id, data);
                alert("Service provider updated successfully.");
            } else {
                await serviceProviderService.create(data);
                alert("Service provider added successfully.");
            }
            handleCloseDialog();
            fetchServiceProviders();
        } catch (error: any) {
            console.error("Failed to save service provider", error);
            const errorMessage = error.response?.data?.message || "Failed to save service provider.";
            alert(errorMessage);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this service provider?")) {
            return;
        }

        try {
            await serviceProviderService.delete(id);
            alert("Service provider deleted successfully.");
            const newTotalPages = Math.ceil((serviceProviders.length - 1) / itemsPerPage);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }
            fetchServiceProviders();
        } catch (error: any) {
            console.error("Failed to delete service provider", error);
            const errorMessage = error.response?.data?.message || "Failed to delete service provider.";
            alert(errorMessage);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Service Providers</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage service provider information.
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Service Provider
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingServiceProvider ? "Edit Service Provider" : "Add Service Provider"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingServiceProvider
                                    ? "Update the service provider information."
                                    : "Add a new service provider to the list."}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. ABC Equipment Service" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Enter service provider address" 
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="contact_no"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contact No</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. +1234567890" {...field} />
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
                                        {editingServiceProvider ? "Update" : "Add"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : serviceProviders.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                            <Wrench className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium">No service providers yet</h3>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                            Add your first service provider to get started.
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
                                    <TableHead>Address</TableHead>
                                    <TableHead>Contact No</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {serviceProviders
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((serviceProvider) => (
                                        <TableRow key={serviceProvider.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                                                        <Wrench className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-medium">{serviceProvider.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{serviceProvider.address || "-"}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{serviceProvider.contact_no || "-"}</span>
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
                                                        <DropdownMenuItem onClick={() => handleOpenDialog(serviceProvider)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDelete(serviceProvider.id)}
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
                        totalPages={Math.ceil(serviceProviders.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={serviceProviders.length}
                    />
                </>
            )}
        </div>
    );
}

