"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { expenseService, Expense, ExpenseFilters } from "@/lib/api/services/expense.service";
import { supplierService, Supplier } from "@/lib/api/services/supplier.service";
import { expenseCategoryService, ExpenseCategory } from "@/lib/api/services/expense-category.service";
import { DollarSign, MoreHorizontal, Eye, Calendar, Plus, Trash2, Building2, Tag, Search } from "lucide-react";
import Link from "next/link";
import { safeFormatDate } from "@/lib/utils/date-format";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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

export default function ExpensesPage() {
    const router = useRouter();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<ExpenseFilters>({});
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadSuppliers();
        loadExpenseCategories();
    }, []);

    useEffect(() => {
        loadExpenses();
    }, [filters, searchTerm]);

    const loadSuppliers = async () => {
        try {
            const data = await supplierService.getAll();
            setSuppliers(data);
        } catch (error) {
            console.error("Failed to load suppliers", error);
        }
    };

    const loadExpenseCategories = async () => {
        try {
            const data = await expenseCategoryService.getAll();
            setExpenseCategories(data);
        } catch (error) {
            console.error("Failed to load expense categories", error);
        }
    };

    const loadExpenses = async () => {
        setLoading(true);
        try {
            const filtersWithSearch = { ...filters };
            if (searchTerm) {
                filtersWithSearch.search = searchTerm;
            }
            const data = await expenseService.getAll(filtersWithSearch);
            const expenseList = Array.isArray(data) ? data : (data as any).data || [];
            setExpenses(expenseList);
        } catch (error) {
            console.error("Failed to load expenses", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (expense: Expense) => {
        setExpenseToDelete(expense);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!expenseToDelete) return;

        try {
            await expenseService.delete(expenseToDelete.id);
            setDeleteDialogOpen(false);
            setExpenseToDelete(null);
            loadExpenses();
        } catch (error: any) {
            console.error("Failed to delete expense", error);
            alert(error?.response?.data?.message || "Failed to delete expense.");
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Expenses" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
                    <Link href="/dashboard/expenses/create">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Expense
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search expenses..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Input
                        type="date"
                        placeholder="Date From"
                        className="w-[180px]"
                        value={filters.date_from || ""}
                        onChange={(e) => setFilters({ ...filters, date_from: e.target.value || undefined })}
                    />
                    <Input
                        type="date"
                        placeholder="Date To"
                        className="w-[180px]"
                        value={filters.date_to || ""}
                        onChange={(e) => setFilters({ ...filters, date_to: e.target.value || undefined })}
                    />
                    <Input
                        type="number"
                        placeholder="Min Amount"
                        className="w-[140px]"
                        value={filters.amount_min || ""}
                        onChange={(e) => setFilters({ ...filters, amount_min: e.target.value ? Number(e.target.value) : undefined })}
                    />
                    <Input
                        type="number"
                        placeholder="Max Amount"
                        className="w-[140px]"
                        value={filters.amount_max || ""}
                        onChange={(e) => setFilters({ ...filters, amount_max: e.target.value ? Number(e.target.value) : undefined })}
                    />
                    <Select
                        value={filters.expense_category_id ? String(filters.expense_category_id) : 'all'}
                        onValueChange={(value) => setFilters({ ...filters, expense_category_id: value === 'all' ? undefined : Number(value) })}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {expenseCategories.map((category) => (
                                <SelectItem key={category.id} value={String(category.id)}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.supplier_id ? String(filters.supplier_id) : 'all'}
                        onValueChange={(value) => setFilters({ ...filters, supplier_id: value === 'all' ? undefined : Number(value) })}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Suppliers" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Suppliers</SelectItem>
                            {suppliers.map((supplier) => (
                                <SelectItem key={supplier.id} value={String(supplier.id)}>
                                    {supplier.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.currency || 'all'}
                        onValueChange={(value) => setFilters({ ...filters, currency: value === 'all' ? undefined : value })}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="All Currencies" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Currencies</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="MVR">MVR</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="AUD">AUD</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.is_recurring === undefined ? 'all' : filters.is_recurring ? 'recurring' : 'one-time'}
                        onValueChange={(value) => {
                            if (value === 'all') {
                                const { is_recurring, ...rest } = filters;
                                setFilters(rest);
                            } else {
                                setFilters({ ...filters, is_recurring: value === 'recurring' });
                            }
                        }}
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="recurring">Recurring</SelectItem>
                            <SelectItem value="one-time">One-Time</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Desktop Table View */}
                <div className="rounded-md border hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Expense No</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Currency</TableHead>
                                <TableHead>Recurring</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : expenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center">
                                        No expenses found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                expenses.map((expense) => (
                                    <TableRow key={expense.id}>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={`/dashboard/expenses/${expense.id}`}
                                                className="hover:underline flex items-center gap-2"
                                            >
                                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                {expense.expense_no || `EXP-${expense.id}`}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            {expense.expense_date ? (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {safeFormatDate(expense.expense_date, "MMM d, yyyy", "-")}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                {expense.supplier?.name || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Tag className="h-4 w-4 text-muted-foreground" />
                                                {expense.expense_category?.name || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {expense.description}
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {Number(expense.amount || 0).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{expense.currency}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {expense.is_recurring ? (
                                                <Badge variant="secondary">
                                                    {expense.recurring_period || "Recurring"}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
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
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            router.push(`/dashboard/expenses/${expense.id}`);
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleDeleteClick(expense);
                                                        }}
                                                        className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {loading ? (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">Loading...</p>
                            </CardContent>
                        </Card>
                    ) : expenses.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No expenses found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        expenses.map((expense) => (
                            <Card key={expense.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2 flex-1">
                                            <Link
                                                href={`/dashboard/expenses/${expense.id}`}
                                                className="font-semibold text-lg hover:underline flex items-center gap-2"
                                            >
                                                <DollarSign className="h-5 w-5 text-muted-foreground" />
                                                {expense.expense_no || `EXP-${expense.id}`}
                                            </Link>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="outline">{expense.currency}</Badge>
                                                {expense.is_recurring && (
                                                    <Badge variant="secondary">
                                                        {expense.recurring_period || "Recurring"}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <CardDescription className="mb-1">Supplier</CardDescription>
                                        <p className="font-medium">{expense.supplier?.name || "-"}</p>
                                    </div>
                                    <div>
                                        <CardDescription className="mb-1">Category</CardDescription>
                                        <p className="font-medium">{expense.expense_category?.name || "-"}</p>
                                    </div>
                                    <div>
                                        <CardDescription className="mb-1">Description</CardDescription>
                                        <p className="text-sm">{expense.description}</p>
                                    </div>
                                    {expense.expense_date && (
                                        <div>
                                            <CardDescription className="mb-1 flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Expense Date
                                            </CardDescription>
                                            <p className="text-sm">
                                                {safeFormatDate(expense.expense_date, "MMM d, yyyy", "-")}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <CardDescription className="mb-1">Amount</CardDescription>
                                        <p className="font-semibold text-lg">
                                            {expense.currency} {Number(expense.amount || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="pt-2 flex gap-2">
                                        <Link href={`/dashboard/expenses/${expense.id}`} className="flex-1">
                                            <Button variant="outline" className="w-full">
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Details
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDeleteClick(expense)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the expense
                                {expenseToDelete && (
                                    <> <strong>{expenseToDelete.expense_no || `EXP-${expenseToDelete.id}`}</strong></>
                                )}
                                {expenseToDelete?.description && (
                                    <> - {expenseToDelete.description}</>
                                )}
                                .
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDelete}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}