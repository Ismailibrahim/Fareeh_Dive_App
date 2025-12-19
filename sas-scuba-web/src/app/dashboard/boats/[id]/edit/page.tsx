"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { BoatForm } from "@/components/boats/BoatForm";
import { Boat, boatService } from "@/lib/api/services/boat.service";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditBoatPage() {
    const params = useParams();
    const boatId = params.id as string;
    const [boat, setBoat] = useState<Boat | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBoat = async () => {
            try {
                const data = await boatService.getById(boatId);
                setBoat(data);
            } catch (error) {
                console.error("Failed to fetch boat", error);
            } finally {
                setLoading(false);
            }
        };

        if (boatId) {
            fetchBoat();
        }
    }, [boatId]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Boat" />
                <div className="flex-1 space-y-6 p-8 pt-6">
                    <div className="text-center">Loading...</div>
                </div>
            </div>
        );
    }

    if (!boat) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Boat" />
                <div className="flex-1 space-y-6 p-8 pt-6">
                    <div className="text-center">Boat not found.</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Edit Boat" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/boats">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Edit Boat</h2>
                        <p className="text-muted-foreground">Update the boat details below.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    <BoatForm initialData={boat} boatId={boatId} />
                </div>
            </div>
        </div>
    );
}

