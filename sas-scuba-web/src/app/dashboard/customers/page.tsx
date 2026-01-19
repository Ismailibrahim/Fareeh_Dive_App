"use client";

import { useState, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Header } from "@/components/layout/Header";
import { Customer } from "@/lib/api/services/customer.service";
import { Pagination } from "@/components/ui/pagination";
import { useCustomers, useDeleteCustomer } from "@/lib/hooks/use-customers";
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
import { Search, MoreHorizontal, User as UserIcon, Plus, Award, AlertCircle, Building2 } from "lucide-react";
import Link from "next/link";
import { safeFormatDate } from "@/lib/utils/date-format";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkAssignAgentDialog } from "@/components/customers/BulkAssignAgentDialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

    // Selection state
    const [selectedCustomers, setSelectedCustomers] = useState<Set<number>>(new Set());
    const [assignAgentDialogOpen, setAssignAgentDialogOpen] = useState(false);

    // Debounce search term (500ms delay)
    const debouncedSearch = useDebouncedCallback((value: string) => {
        setDebouncedSearchTerm(value);
        setCurrentPage(1); // Reset to first page on new search
    }, 500);

    // Fetch customers using React Query
    const { data: customersData, isLoading, error } = useCustomers({
        page: currentPage,
        per_page: 20,
        search: debouncedSearchTerm || undefined,
    });

    // Delete mutation
    const deleteMutation = useDeleteCustomer();

    // Extract customers and pagination from response
    const customers = useMemo(() => {
        if (!customersData) return [];
        return customersData.data || [];
    }, [customersData]);

    const pagination = useMemo(() => {
        if (!customersData) {
            return {
                total: 0,
                per_page: 20,
                last_page: 1,
                current_page: 1,
            };
        }
        return {
            total: customersData.total || 0,
            per_page: customersData.per_page || 20,
            last_page: customersData.last_page || 1,
            current_page: customersData.current_page || currentPage,
        };
    }, [customersData, currentPage]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        debouncedSearch(value);
    };

    const handleDeleteClick = (customer: Customer) => {
        setCustomerToDelete(customer);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!customerToDelete) return;
        try {
            await deleteMutation.mutateAsync(customerToDelete.id);
            setDeleteDialogOpen(false);
            setCustomerToDelete(null);
        } catch (error) {
            console.error("Failed to delete customer", error);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setSelectedCustomers(new Set()); // Clear selection on page change
    };

    const handleSelectCustomer = (customerId: number, checked: boolean) => {
        setSelectedCustomers(prev => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(customerId);
            } else {
                newSet.delete(customerId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedCustomers.size === customers.length) {
            setSelectedCustomers(new Set());
        } else {
            setSelectedCustomers(new Set(customers.map(c => c.id)));
        }
    };

    const handleAssignAgentSuccess = () => {
        setSelectedCustomers(new Set());
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Customers" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
                    <div className="flex items-center space-x-2">
                        {selectedCustomers.size > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => setAssignAgentDialogOpen(true)}
                            >
                                <Building2 className="mr-2 h-4 w-4" />
                                Assign Agent ({selectedCustomers.size})
                            </Button>
                        )}
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
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>
                </div>
                <div className="rounded-md border hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={customers.length > 0 && selectedCustomers.size === customers.length}
                                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                    />
                                </TableHead>
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
                            {isLoading ? (
                                <>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                            </TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell className="text-right">
                                                <Skeleton className="h-8 w-8 ml-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        <div className="flex flex-col items-center gap-2 text-red-600">
                                            <AlertCircle className="h-5 w-5" />
                                            <div>
                                                <p className="font-medium">Error loading customers</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {error instanceof Error ? error.message : 'Please try again or refresh the page'}
                                                </p>
                                            </div>
                                        </div>
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
                                            <Checkbox
                                                checked={selectedCustomers.has(customer.id)}
                                                onCheckedChange={() => handleSelectCustomer(customer.id)}
                                            />
                                        </TableCell>
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
                                            {customer.date_of_birth ? safeFormatDate(customer.date_of_birth, "MMM d, yyyy", "-") : "-"}
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
                            onPageChange={handlePageChange}
                            itemsPerPage={pagination.per_page}
                            totalItems={pagination.total}
                        />
                    </div>
                )}

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {isLoading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Skeleton className="h-16" />
                                        <Skeleton className="h-16" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center p-4 border rounded-md bg-red-50 text-red-600">
                            Error loading customers. Please try again.
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="text-center p-4 border rounded-md bg-muted/50">No customers found.</div>
                    ) : (
                        customers.map((customer) => (
                            <div key={customer.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            checked={selectedCustomers.has(customer.id)}
                                            onCheckedChange={(checked) => handleSelectCustomer(customer.id, checked as boolean)}
                                        />
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
                                        <span>{customer.date_of_birth ? safeFormatDate(customer.date_of_birth, "MMM d, yyyy", "-") : "-"} ({customer.gender || "-"})</span>
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

            <BulkAssignAgentDialog
                open={assignAgentDialogOpen}
                onOpenChange={setAssignAgentDialogOpen}
                selectedCustomerIds={Array.from(selectedCustomers)}
                onSuccess={handleAssignAgentSuccess}
            />
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
