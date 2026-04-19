"use client";

import { Suspense, useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { WaiverForm } from "@/components/waivers/WaiverForm";
import { PageLoader } from "@/components/ui/page-loader";
import { waiverService, Waiver } from "@/lib/api/services/waiver.service";

export default function EditWaiverPage({
    params,
}: {
    params: { id: string };
}) {
    const [waiver, setWaiver] = useState<Waiver | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadWaiver = async () => {
            try {
                const response = await waiverService.getById(Number(params.id));
                // The service returns { success: true, data: Waiver }
                setWaiver(response?.data);
            } catch (error) {
                console.error("Failed to load waiver", error);
            } finally {
                setLoading(false);
            }
        };
        loadWaiver();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header title="Edit Waiver" />
                <div className="p-8">
                    <PageLoader />
                </div>
            </div>
        );
    }

    if (!waiver) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header title="Edit Waiver" />
                <div className="p-8">
                    <div className="text-center text-muted-foreground">Waiver not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Edit Waiver" />
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
                    <WaiverForm initialData={waiver} waiverId={waiver.id} />
                </div>
            </div>
        </div>
    );
}
