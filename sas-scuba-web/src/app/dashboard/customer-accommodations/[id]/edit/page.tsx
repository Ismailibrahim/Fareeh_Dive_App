"use client";

import { CustomerAccommodationForm } from "@/components/customers/CustomerAccommodationForm";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CustomerAccommodation, customerAccommodationService } from "@/lib/api/services/customer-accommodation.service";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function EditCustomerAccommodationContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const customerId = searchParams.get('customer_id');
    const [accommodation, setAccommodation] = useState<CustomerAccommodation | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAccommodation = async () => {
            if (!params.id) return;
            try {
                const data = await customerAccommodationService.getById(Number(params.id));
                setAccommodation(data);
            } catch (error) {
                console.error("Failed to fetch accommodation", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAccommodation();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Accommodation" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!accommodation) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Accommodation" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-muted-foreground">Accommodation not found</p>
                        <Link href={customerId ? `/dashboard/customers/${customerId}` : "/dashboard/customers"}>
                            <Button variant="outline" className="mt-4">
                                Back
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const handleSave = () => {
        // Redirect back to customer page
        window.location.href = customerId ? `/dashboard/customers/${customerId}` : '/dashboard/customers';
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Edit Accommodation" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href={customerId ? `/dashboard/customers/${customerId}` : "/dashboard/customers"}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Edit Accommodation Details</h2>
                        <p className="text-muted-foreground">Update accommodation details.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    <CustomerAccommodationForm
                        customerId={customerId || accommodation.customer_id.toString()}
                        initialData={accommodation}
                        onSave={handleSave}
                        onCancel={() => {
                            window.location.href = customerId ? `/dashboard/customers/${customerId}` : '/dashboard/customers';
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default function EditCustomerAccommodationPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Accommodation" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        }>
            <EditCustomerAccommodationContent />
        </Suspense>
    );
}

