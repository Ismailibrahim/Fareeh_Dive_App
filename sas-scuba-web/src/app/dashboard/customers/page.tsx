"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Customer, customerService, PaginatedResponse } from "@/lib/api/services/customer.service";
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
import { Search, MoreHorizontal, User as UserIcon, Plus, Award, AlertCircle } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
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
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

    const fetchCustomers = useCallback(async (page = 1, search = "") => {
        setLoading(true);
        try {
            const response = await customerService.getAll({
                page,
                per_page: 20,
                search: search || undefined,
            });
            
            // Handle Laravel pagination response
            if (response.data && Array.isArray(response.data)) {
                setCustomers(response.data);
                setPagination({
                    total: response.total || 0,
                    per_page: response.per_page || 20,
                    last_page: response.last_page || 1,
                    current_page: response.current_page || page,
                });
            } else {
                // Fallback for non-paginated response
                const customerList = Array.isArray(response) ? response : (response as any).data || [];
                setCustomers(customerList);
            }
        } catch (error) {
            console.error("Failed to fetch customers", error);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchCustomers(1, "");
    }, [fetchCustomers]);

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setCurrentPage(1);
            fetchCustomers(1, searchTerm);
        }, 300); // 300ms debounce
        
        return () => clearTimeout(timeoutId);
    }, [searchTerm, fetchCustomers]);

    const handleDeleteClick = (customer: Customer) => {
        setCustomerToDelete(customer);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!customerToDelete) return;
        try {
            await customerService.delete(customerToDelete.id);
            // Refresh current page after delete
            fetchCustomers(currentPage, searchTerm);
        } catch (error) {
            console.error("Failed to delete customer", error);
        } finally {
            setDeleteDialogOpen(false);
            setCustomerToDelete(null);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Customers" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/customers/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Customer
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search customers..."
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
                                <TableHead className="w-[80px]">Avatar</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Passport No</TableHead>
                                <TableHead>Nationality</TableHead>
                                <TableHead>Gender</TableHead>
                                <TableHead>Date of Birth</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : customers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        No customers found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                customers.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell>
                                            <Avatar>
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {customer.full_name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {customer.full_name}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span>{customer.email}</span>
                                                <span className="text-muted-foreground text-xs">{customer.phone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {customer.passport_no || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {customer.nationality || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {customer.gender || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {customer.date_of_birth || "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <CustomerActions
                                                        customerId={customer.id}
                                                        onDelete={() => handleDeleteClick(customer)}
                                                    />
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="flex justify-center">
                        <Pagination
                            currentPage={pagination.current_page}
                            totalPages={pagination.last_page}
                            onPageChange={(page) => {
                                setCurrentPage(page);
                                fetchCustomers(page, searchTerm);
                            }}
                            itemsPerPage={pagination.per_page}
                            totalItems={pagination.total}
                        />
                    </div>
                )}

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {loading ? (
                        <div className="text-center p-4">Loading...</div>
                    ) : customers.length === 0 ? (
                        <div className="text-center p-4 border rounded-md bg-muted/50">No customers found.</div>
                    ) : (
                        customers.map((customer) => (
                            <div key={customer.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {customer.full_name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold leading-none tracking-tight">{customer.full_name}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">{customer.email}</p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <CustomerActions
                                                customerId={customer.id}
                                                onDelete={() => handleDeleteClick(customer)}
                                            />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Phone</span>
                                        <span>{customer.phone || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Nationality</span>
                                        <span>{customer.nationality || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Passport No</span>
                                        <span>{customer.passport_no || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">DOB (Gender)</span>
                                        <span>{customer.date_of_birth || "-"} ({customer.gender || "-"})</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the customer
                            <strong> {customerToDelete?.full_name} </strong>
                            and remove their data from our servers.
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

function CustomerActions({ customerId, onDelete }: { customerId: number | string, onDelete: () => void }) {
    return (
        <>
            <DropdownMenuItem asChild>
                <Link href={`/dashboard/customers/${customerId}`} className="cursor-pointer flex w-full items-center">
                    View Details
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href={`/dashboard/customers/${customerId}/edit`} className="cursor-pointer flex w-full items-center">
                    Edit
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href={`/dashboard/customer-certifications/create?customer_id=${customerId}`} className="cursor-pointer flex w-full items-center">
                    <Award className="mr-2 h-4 w-4" />
                    Add Certification
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href={`/dashboard/emergency-contacts/create?customer_id=${customerId}`} className="cursor-pointer flex w-full items-center">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Add Emergency Contact
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                onSelect={(e) => {
                    e.preventDefault();
                    onDelete();
                }}
            >
                Delete
            </DropdownMenuItem>
        </>
    );
}
