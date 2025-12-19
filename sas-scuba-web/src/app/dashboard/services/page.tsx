"use client";

import { Header } from "@/components/layout/Header";
import { BulkServiceForm } from "@/components/services/BulkServiceForm";

export default function ServicesPage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Service" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Bulk Service</h2>
                    <p className="text-muted-foreground">
                        Select multiple equipment items and send them for service at once. Record the cost and update service dates for all selected items.
                    </p>
                </div>

                <div className="mx-auto max-w-5xl">
                    <BulkServiceForm />
                </div>
            </div>
        </div>
    );
}

