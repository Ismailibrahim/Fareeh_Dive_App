"use client";

import { Header } from "@/components/layout/Header";
import { BulkEquipmentItemForm } from "@/components/equipment-items/BulkEquipmentItemForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BulkCreateEquipmentItemPage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Bulk Create Equipment Items" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/equipment-items">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Bulk Create Equipment Items</h2>
                        <p className="text-muted-foreground">Set common fields once and create multiple equipment items with varying details.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-5xl">
                    <BulkEquipmentItemForm />
                </div>
            </div>
        </div>
    );
}

