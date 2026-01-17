"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, MoreHorizontal, Building2, Search } from "lucide-react";
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
import { supplierService, Supplier, SupplierFormData } from "@/lib/api/services/supplier.service";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const supplierSchema = z.object({
    name: z.string().min(1, "Supplier name is required.").max(255, "Name must be less than 255 characters."),
    address: z.string().optional(),
    contact_no: z.string().optional(),
    email: z.string().email("Invalid email address.").optional().or(z.literal("")),
    gst_tin: z.string().optional(),
    currency: z.enum(['USD', 'MVR']),
    status: z.enum(['Active', 'Suspended']),
});

// Form values type (matches schema)
type SupplierFormValues = z.infer<typeof supplierSchema>;

export function SuppliersList() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const itemsPerPage = 10;

    const form = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            name: "",
            address: "",
            contact_no: "",
            email: "",
            gst_tin: "",
            currency: 'MVR',
            status: 'Active',
        },
    });

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const params: { status?: string; search?: string } = {};
            if (statusFilter && statusFilter !== 'all') {
                params.status = statusFilter;
            }
            if (searchTerm) {
                params.search = searchTerm;
            }
            const data = await supplierService.getAll(params);
            setSuppliers(data);
        } catch (error) {
            console.error("Failed to fetch suppliers", error);
            alert("Failed to load suppliers.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, [statusFilter]);

    const handleSearch = () => {
        fetchSuppliers();
    };

    const handleOpenDialog = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            form.reset({
                name: supplier.name,
                address: supplier.address || "",
                contact_no: supplier.contact_no || "",
                email: supplier.email || "",
                gst_tin: supplier.gst_tin || "",
                currency: supplier.currency,
                status: supplier.status,
            });
        } else {
            setEditingSupplier(null);
            form.reset({
                name: "",
                address: "",
                contact_no: "",
                email: "",
                gst_tin: "",
                currency: 'MVR',
                status: 'Active',
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingSupplier(null);
        form.reset();
    };

    const onSubmit = async (data: SupplierFormValues) => {
        try {
            // Transform form data to API format
            const payload: SupplierFormData = {
                name: data.name,
                address: data.address && data.address !== "" ? data.address : undefined,
                contact_no: data.contact_no && data.contact_no !== "" ? data.contact_no : undefined,
                email: data.email && data.email !== "" ? data.email : undefined,
                gst_tin: data.gst_tin && data.gst_tin !== "" ? data.gst_tin : undefined,
                currency: data.currency,
                status: data.status,
            };
            
            if (editingSupplier) {
                await supplierService.update(editingSupplier.id, payload);
                alert("Supplier updated successfully.");
            } else {
                await supplierService.create(payload);
                alert("Supplier added successfully.");
            }
            handleCloseDialog();
            fetchSuppliers();
        } catch (error: any) {
            console.error("Failed to save supplier", error);
            
            // Handle validation errors
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                const firstError = Object.values(errors)[0];
                const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
                alert(errorMessage || "Validation error. Please check your input.");
            } else {
                const errorMessage = error.response?.data?.message || "Failed to save supplier.";
                alert(errorMessage);
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this supplier?")) {
            return;
        }

        try {
            await supplierService.delete(id);
            alert("Supplier deleted successfully.");
            const newTotalPages = Math.ceil((suppliers.length - 1) / itemsPerPage);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }
            fetchSuppliers();
        } catch (error: any) {
            console.error("Failed to delete supplier", error);
            const errorMessage = error.response?.data?.message || "Failed to delete supplier.";
            alert(errorMessage);
        }
    };

    const paginatedSuppliers = suppliers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Suppliers</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage supplier information for your dive center.
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Supplier
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingSupplier ? "Edit Supplier" : "Add Supplier"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingSupplier
                                    ? "Update the supplier details."
                                    : "Add a new supplier to the list."}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Supplier Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. ABC Suppliers" {...field} />
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
                                                    placeholder="Supplier address" 
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="contact_no"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Contact No</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. +960 123-4567" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="e.g. info@supplier.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="gst_tin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>GST TIN</FormLabel>
                                            <FormControl>
                                                <Input placeholder="GST TIN number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="currency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Currency</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select currency" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="USD">USD</SelectItem>
                                                        <SelectItem value="MVR">MVR</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Active">Active</SelectItem>
                                                        <SelectItem value="Suspended">Suspended</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCloseDialog}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        {editingSupplier ? "Update" : "Add"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search suppliers by name, email, contact, or address..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch();
                            }
                        }}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter || 'all'} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : suppliers.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium">No suppliers yet</h3>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                            Add your first supplier to get started.
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
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Currency</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedSuppliers.map((supplier) => (
                                    <TableRow key={supplier.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <span className="font-medium">{supplier.name}</span>
                                                    {supplier.address && (
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {supplier.address}
                                                        </p>
                                                    )}
                                                    {supplier.gst_tin && (
                                                        <p className="text-xs text-muted-foreground">
                                                            GST TIN: {supplier.gst_tin}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {supplier.contact_no || (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {supplier.email || (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{supplier.currency}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={supplier.status === 'Active' ? "default" : "secondary"}>
                                                {supplier.status}
                                            </Badge>
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
                                                    <DropdownMenuItem onClick={() => handleOpenDialog(supplier)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => handleDelete(supplier.id)}
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
                        totalPages={Math.ceil(suppliers.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={suppliers.length}
                    />
                </>
            )}
        </div>
    );
}
