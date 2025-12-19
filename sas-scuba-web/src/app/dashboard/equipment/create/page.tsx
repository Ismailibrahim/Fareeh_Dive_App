"use client";

import { Header } from "@/components/layout/Header";
import { EquipmentForm } from "@/components/equipment/EquipmentForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateEquipmentPage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="New Equipment" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/equipment">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Add New Equipment</h2>
                        <p className="text-muted-foreground">Fill in the details below to register new equipment.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    <EquipmentForm />
                </div>
            </div>
        </div>
    );
}

