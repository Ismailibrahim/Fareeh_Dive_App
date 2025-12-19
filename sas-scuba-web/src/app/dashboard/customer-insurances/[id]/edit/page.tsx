"use client";

import { CustomerInsuranceForm } from "@/components/customer-insurances/CustomerInsuranceForm";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CustomerInsurance, customerInsuranceService } from "@/lib/api/services/customer-insurance.service";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function EditCustomerInsuranceContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const customerId = searchParams.get('customer_id');
    const [insurance, setInsurance] = useState<CustomerInsurance | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsurance = async () => {
            if (!params.id) return;
            try {
                const data = await customerInsuranceService.getById(Number(params.id));
                setInsurance(data);
            } catch (error) {
                console.error("Failed to fetch insurance", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInsurance();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Insurance" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!insurance) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Insurance" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-muted-foreground">Insurance not found</p>
                        <Link href={customerId ? `/dashboard/customers/${customerId}` : "/dashboard/customer-insurances"}>
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
            <Header title="Edit Insurance" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href={customerId ? `/dashboard/customers/${customerId}` : "/dashboard/customer-insurances"}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Edit Insurance</h2>
                        <p className="text-muted-foreground">Update insurance details.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    <CustomerInsuranceForm
                        initialData={insurance}
                        insuranceId={insurance.id}
                        disableCustomerSelect={!!customerId}
                        redirectToCustomer={!!customerId}
                    />
                </div>
            </div>
        </div>
    );
}

export default function EditCustomerInsurancePage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Insurance" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        }>
            <EditCustomerInsuranceContent />
        </Suspense>
    );
}

