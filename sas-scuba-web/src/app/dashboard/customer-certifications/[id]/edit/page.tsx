"use client";

import { CustomerCertificationForm } from "@/components/customer-certifications/CustomerCertificationForm";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CustomerCertification, customerCertificationService } from "@/lib/api/services/customer-certification.service";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function EditCustomerCertificationContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const customerId = searchParams.get('customer_id');
    const [certification, setCertification] = useState<CustomerCertification | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCertification = async () => {
            if (!params.id) return;
            try {
                const data = await customerCertificationService.getById(Number(params.id));
                setCertification(data);
            } catch (error) {
                console.error("Failed to fetch certification", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCertification();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Certification" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!certification) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Certification" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-muted-foreground">Certification not found</p>
                        <Link href={customerId ? `/dashboard/customers/${customerId}` : "/dashboard/customer-certifications"}>
                            <Button variant="outline" className="mt-4">
                                Back
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Edit Certification" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href={customerId ? `/dashboard/customers/${customerId}` : "/dashboard/customer-certifications"}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Edit Certification</h2>
                        <p className="text-muted-foreground">Update certification details.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    <CustomerCertificationForm
                        initialData={certification}
                        certificationId={certification.id}
                        redirectToCustomer={!!customerId}
                    />
                </div>
            </div>
        </div>
    );
}

export default function EditCustomerCertificationPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Certification" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        }>
            <EditCustomerCertificationContent />
        </Suspense>
    );
}
