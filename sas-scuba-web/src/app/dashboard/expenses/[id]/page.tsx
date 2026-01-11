"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { expenseService, Expense } from "@/lib/api/services/expense.service";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { DollarSign, Calendar, Building2, Tag, FileText, Edit, Trash2, ArrowLeft, Repeat, User } from "lucide-react";
import { safeFormatDate } from "@/lib/utils/date-format";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";

export default function ExpenseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const expenseId = params.id as string;
    const [expense, setExpense] = useState<Expense | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    useEffect(() => {
        if (!expenseId) return;

        const loadExpense = async () => {
            try {
                const data = await expenseService.getById(expenseId);
                setExpense(data);
            } catch (error) {
                console.error("Failed to load expense", error);
            } finally {
                setLoading(false);
            }
        };

        loadExpense();
    }, [expenseId]);

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!expense) return;

        try {
            await expenseService.delete(expense.id);
            router.push("/dashboard/expenses");
            router.refresh();
        } catch (error: any) {
            console.error("Failed to delete expense", error);
            alert(error?.response?.data?.message || "Failed to delete expense.");
        }
    };

    const handleSaveSuccess = () => {
        setEditing(false);
        if (expenseId) {
            const loadExpense = async () => {
                try {
                    const data = await expenseService.getById(expenseId);
                    setExpense(data);
                } catch (error) {
                    console.error("Failed to reload expense", error);
                }
            };
            loadExpense();
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Expense Details" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!expense) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Expense Details" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-muted-foreground">Expense not found</p>
                        <Link href="/dashboard/expenses">
                            <Button variant="outline" className="mt-4">
                                Back to Expenses
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (editing) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header title={`Edit Expense ${expense.expense_no || `#${expense.id}`}`} />
                <div className="flex-1 space-y-4 p-8 pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Link href="/dashboard/expenses" className="text-sm text-muted-foreground hover:underline mb-2 block">
                                ← Back to Expenses
                            </Link>
                            <h2 className="text-3xl font-bold">Edit Expense</h2>
                        </div>
                        <Button variant="outline" onClick={() => setEditing(false)}>
                            Cancel
                        </Button>
                    </div>
                    <ExpenseForm initialData={expense} expenseId={expenseId} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title={`Expense ${expense.expense_no || `#${expense.id}`}`} />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/dashboard/expenses" className="text-sm text-muted-foreground hover:underline mb-2 block">
                            ← Back to Expenses
                        </Link>
                        <h1 className="text-3xl font-bold">
                            {expense.expense_no || `EXP-${expense.id}`}
                        </h1>
                        <p className="text-muted-foreground">
                            {expense.description}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setEditing(true)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                        <Button variant="outline" onClick={handleDeleteClick} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Expense Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-primary" />
                                Expense Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <CardDescription>Expense Number</CardDescription>
                                <p className="font-medium">{expense.expense_no || `EXP-${expense.id}`}</p>
                            </div>
                            <div>
                                <CardDescription className="flex items-center gap-2 mb-1">
                                    <Calendar className="h-4 w-4" />
                                    Expense Date
                                </CardDescription>
                                <p className="font-medium">
                                    {expense.expense_date ? safeFormatDate(expense.expense_date, "MMM d, yyyy", "-") : "-"}
                                </p>
                            </div>
                            <div>
                                <CardDescription>Amount</CardDescription>
                                <p className="text-2xl font-bold">
                                    {expense.currency} {Number(expense.amount || 0).toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <CardDescription>Currency</CardDescription>
                                <Badge variant="outline" className="mt-1">
                                    {expense.currency}
                                </Badge>
                            </div>
                            {expense.is_recurring && (
                                <div>
                                    <CardDescription className="flex items-center gap-2 mb-1">
                                        <Repeat className="h-4 w-4" />
                                        Recurring Period
                                    </CardDescription>
                                    <Badge variant="secondary">
                                        {expense.recurring_period || "Recurring"}
                                    </Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Related Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                Related Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <CardDescription className="flex items-center gap-2 mb-1">
                                    <Building2 className="h-4 w-4" />
                                    Supplier
                                </CardDescription>
                                <p className="font-medium">{expense.supplier?.name || "-"}</p>
                            </div>
                            <div>
                                <CardDescription className="flex items-center gap-2 mb-1">
                                    <Tag className="h-4 w-4" />
                                    Expense Category
                                </CardDescription>
                                <p className="font-medium">{expense.expense_category?.name || "-"}</p>
                            </div>
                            {expense.created_by_user && (
                                <div>
                                    <CardDescription className="flex items-center gap-2 mb-1">
                                        <User className="h-4 w-4" />
                                        Created By
                                    </CardDescription>
                                    <p className="font-medium">{expense.created_by_user.full_name}</p>
                                </div>
                            )}
                            {expense.created_at && (
                                <div>
                                    <CardDescription>Created At</CardDescription>
                                    <p className="text-sm text-muted-foreground">
                                        {safeFormatDate(expense.created_at, "MMM d, yyyy 'at' h:mm a", "-")}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Description and Notes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Description & Notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <CardDescription>Description</CardDescription>
                            <p className="mt-1">{expense.description}</p>
                        </div>
                        {expense.notes && (
                            <div>
                                <CardDescription>Notes</CardDescription>
                                <p className="mt-1 whitespace-pre-wrap">{expense.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the expense
                                <strong> {expense.expense_no || `EXP-${expense.id}`}</strong>
                                {expense.description && (
                                    <> - {expense.description}</>
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