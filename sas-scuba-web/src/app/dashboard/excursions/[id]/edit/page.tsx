"use client";

import { Header } from "@/components/layout/Header";
import { ExcursionForm } from "@/components/excursions/ExcursionForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { excursionService, Excursion } from "@/lib/api/services/excursion.service";

export default function EditExcursionPage() {
    const params = useParams();
    const id = params.id as string;
    const [excursion, setExcursion] = useState<Excursion | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchExcursion = async () => {
            try {
                const data = await excursionService.getById(id);
                setExcursion(data);
            } catch (error) {
                console.error("Failed to fetch excursion", error);
            } finally {
                setLoading(false);
            }
        };
        fetchExcursion();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Excursion" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            </div>
        );
    }

    if (!excursion) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Excursion" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-muted-foreground">Excursion not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Edit Excursion" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/excursions">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Edit Excursion</h2>
                        <p className="text-muted-foreground">Update excursion details.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    <ExcursionForm initialData={excursion} excursionId={id} />
                </div>
            </div>
        </div>
    );
}
