"use client";

import { Header } from "@/components/layout/Header";
import { DiveSiteForm } from "@/components/dive-sites/DiveSiteForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { diveSiteService, DiveSite } from "@/lib/api/services/dive-site.service";

export default function EditDiveSitePage() {
    const params = useParams();
    const id = params.id as string;
    const [diveSite, setDiveSite] = useState<DiveSite | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchDiveSite = async () => {
            try {
                const data = await diveSiteService.getById(id);
                setDiveSite(data);
            } catch (error) {
                console.error("Failed to fetch dive site", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDiveSite();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Dive Site" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            </div>
        );
    }

    if (!diveSite) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Dive Site" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-muted-foreground">Dive site not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Edit Dive Site" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/dive-sites">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Edit Dive Site</h2>
                        <p className="text-muted-foreground">Update dive site details.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    <DiveSiteForm initialData={diveSite} diveSiteId={id} />
                </div>
            </div>
        </div>
    );
}

