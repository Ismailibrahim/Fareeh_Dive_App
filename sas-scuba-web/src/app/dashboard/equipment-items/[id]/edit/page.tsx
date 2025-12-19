"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { EquipmentItemForm } from "@/components/equipment-items/EquipmentItemForm";
import { ServiceHistorySection } from "@/components/equipment-items/ServiceHistorySection";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { equipmentItemService, EquipmentItem } from "@/lib/api/services/equipment-item.service";

export default function EditEquipmentItemPage() {
    const params = useParams();
    const router = useRouter();
    const itemId = params.id as string;
    const [equipmentItem, setEquipmentItem] = useState<EquipmentItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEquipmentItem = async () => {
            try {
                const data = await equipmentItemService.getById(itemId);
                setEquipmentItem(data);
            } catch (error) {
                console.error("Failed to fetch equipment item", error);
            } finally {
                setLoading(false);
            }
        };

        if (itemId) {
            fetchEquipmentItem();
        }
    }, [itemId]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Equipment Item" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Edit Equipment Item" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/equipment-items">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Edit Equipment Item</h2>
                        <p className="text-muted-foreground">Update the equipment item details below.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-5xl space-y-6">
                    {equipmentItem && (
                        <>
                            <EquipmentItemForm initialData={equipmentItem} equipmentItemId={itemId} />
                            {equipmentItem.requires_service && (
                                <ServiceHistorySection 
                                    equipmentItemId={itemId} 
                                    equipmentItem={equipmentItem}
                                    onEquipmentItemUpdate={(updatedItem) => {
                                        setEquipmentItem(updatedItem);
                                        // Refresh the equipment items list page when navigating back
                                        router.refresh();
                                    }}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

