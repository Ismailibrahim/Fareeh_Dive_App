"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { EquipmentForm } from "@/components/equipment/EquipmentForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { equipmentService, Equipment } from "@/lib/api/services/equipment.service";

export default function EditEquipmentPage() {
    const params = useParams();
    const equipmentId = params.id as string;
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const data = await equipmentService.getById(equipmentId);
                setEquipment(data);
            } catch (error) {
                console.error("Failed to fetch equipment", error);
            } finally {
                setLoading(false);
            }
        };

        if (equipmentId) {
            fetchEquipment();
        }
    }, [equipmentId]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Equipment" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Edit Equipment" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/equipment">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Edit Equipment</h2>
                        <p className="text-muted-foreground">Update the equipment details below.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    {equipment && <EquipmentForm initialData={equipment} equipmentId={equipmentId} />}
                </div>
            </div>
        </div>
    );
}

