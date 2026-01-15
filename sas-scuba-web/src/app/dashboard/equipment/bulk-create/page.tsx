"use client";

import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Lazy load BulkEquipmentForm to reduce initial bundle size
const BulkEquipmentForm = dynamic(() => import("@/components/equipment/BulkEquipmentForm").then(mod => ({ default: mod.BulkEquipmentForm })), {
    loading: () => (
        <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    ),
    ssr: false, // Forms don't need SSR
});

export default function BulkCreateEquipmentPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Bulk Create Equipment" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/equipment">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Bulk Create Equipment</h2>
                        <p className="text-muted-foreground">
                            Add multiple equipment items at once. Fill in the details for each equipment below.
                        </p>
                    </div>
                </div>

                <div className="w-full">
                    <BulkEquipmentForm
                        onSuccess={() => {
                            router.push("/dashboard/equipment");
                            router.refresh();
                        }}
                        onCancel={() => router.push("/dashboard/equipment")}
                    />
                </div>
            </div>
        </div>
    );
}

