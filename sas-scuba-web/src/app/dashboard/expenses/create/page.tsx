"use client";

import { Header } from "@/components/layout/Header";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export default function CreateExpensePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Create Expense" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Create Expense</h2>
                    <p className="text-muted-foreground">Add a new expense to your records.</p>
                </div>
                <ExpenseForm />
            </div>
        </div>
    );
}