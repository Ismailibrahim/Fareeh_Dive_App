"use client";

import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Lazy load BulkEquipmentItemForm to reduce initial bundle size
const BulkEquipmentItemForm = dynamic(() => import("@/components/equipment-items/BulkEquipmentItemForm").then(mod => ({ default: mod.BulkEquipmentItemForm })), {
    loading: () => (
        <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    ),
    ssr: false, // Forms don't need SSR
});

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

