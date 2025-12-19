"use client";

import { EmergencyContactForm } from "@/components/customers/EmergencyContactForm";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmergencyContact, emergencyContactService } from "@/lib/api/services/emergency-contact.service";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function EditEmergencyContactContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const customerId = searchParams.get('customer_id');
    const [contact, setContact] = useState<EmergencyContact | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContact = async () => {
            if (!params.id || !customerId) return;
            try {
                const data = await emergencyContactService.getById(customerId, Number(params.id));
                setContact(data);
            } catch (error) {
                console.error("Failed to fetch emergency contact", error);
            } finally {
                setLoading(false);
            }
        };
        fetchContact();
    }, [params.id, customerId]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Emergency Contact" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!contact) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Emergency Contact" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-muted-foreground">Emergency contact not found</p>
                        <Link href={customerId ? `/dashboard/customers/${customerId}` : "/dashboard/emergency-contacts"}>
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
        // Redirect back to customer page or emergency contacts list
        window.location.href = customerId ? `/dashboard/customers/${customerId}` : '/dashboard/emergency-contacts';
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Edit Emergency Contact" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href={customerId ? `/dashboard/customers/${customerId}` : "/dashboard/emergency-contacts"}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Edit Emergency Contact</h2>
                        <p className="text-muted-foreground">Update emergency contact details.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl">
                    <EmergencyContactForm
                        customerId={customerId || contact.customer_id.toString()}
                        initialData={contact}
                        onSave={handleSave}
                        onCancel={() => {
                            window.location.href = customerId ? `/dashboard/customers/${customerId}` : '/dashboard/emergency-contacts';
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default function EditEmergencyContactPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Edit Emergency Contact" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        }>
            <EditEmergencyContactContent />
        </Suspense>
    );
}

