"use client";

import { Suspense, useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { WaiverSigningForm } from "@/components/waivers/WaiverSigningForm";
import { PageLoader } from "@/components/ui/page-loader";
import { waiverService, Waiver } from "@/lib/api/services/waiver.service";
import { useSearchParams, useParams } from "next/navigation";

function SignWaiverContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const [waiver, setWaiver] = useState<Waiver | null>(null);
    const [loading, setLoading] = useState(true);
    const customerId = searchParams.get('customer_id') ? Number(searchParams.get('customer_id')) : undefined;
    const bookingId = searchParams.get('booking_id') ? Number(searchParams.get('booking_id')) : undefined;

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
        return <PageLoader />;
    }

    if (!waiver) {
        return (
            <div className="text-center text-muted-foreground py-8">Waiver not found</div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <WaiverSigningForm
                waiver={waiver}
                customerId={customerId}
                bookingId={bookingId}
            />
        </div>
    );
}

export default function SignWaiverPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Sign Waiver" />
            <div className="p-8">
                <Suspense fallback={<PageLoader />}>
                    <SignWaiverContent />
                </Suspense>
            </div>
        </div>
    );
}
