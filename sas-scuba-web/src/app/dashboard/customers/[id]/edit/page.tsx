"use client";

import { Header } from "@/components/layout/Header";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { CustomerCertificationsSection } from "@/components/customers/CustomerCertificationsSection";
import { EmergencyContactsSection } from "@/components/customers/EmergencyContactsSection";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { customerService, Customer } from "@/lib/api/services/customer.service";

export default function EditCustomerPage() {
    const params = useParams();
    const id = params.id as string;
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchCustomer = async () => {
            try {
                const data = await customerService.getById(id);
                setCustomer(data);
            } catch (error) {
                console.error("Failed to fetch customer", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomer();
    }, [id]);

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!customer) {
        return <div className="p-8">Customer not found</div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Edit Customer" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/customers">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Edit Customer</h2>
                        <p className="text-muted-foreground">Update customer details.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl space-y-6">
                    <CustomerForm initialData={customer} customerId={id} />
                    
                    {/* Emergency Contacts Section */}
                    <EmergencyContactsSection customerId={id} />
                    
                    {/* Certifications Section */}
                    <CustomerCertificationsSection customerId={id} />
                </div>
            </div>
        </div>
    );
}
