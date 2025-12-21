"use client";

import { Header } from "@/components/layout/Header";
import { CustomerInsuranceForm } from "@/components/customer-insurances/CustomerInsuranceForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, Mail, Phone, FileText, Globe, Calendar, UserCircle, Shield, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useCustomer } from "@/lib/hooks/use-customers";
import { useCustomerInsurances } from "@/lib/hooks/use-customer-insurances";
import { format } from "date-fns";

function CreateCustomerInsuranceContent() {
    const searchParams = useSearchParams();
    const customerId = searchParams.get('customer_id');
    const [initialData, setInitialData] = useState<any>(null);
    
    // Use React Query hooks for instant cached data
    const { data: customer, isLoading: loadingCustomer } = useCustomer(customerId);
    const { data: existingInsurance, isLoading: loadingInsurance } = useCustomerInsurances(customerId);

    useEffect(() => {
        if (customerId) {
            setInitialData({ customer_id: parseInt(customerId) });
        }
    }, [customerId]);

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="New Insurance" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href={customerId ? `/dashboard/customers/${customerId}` : "/dashboard/customer-insurances"}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Add New Insurance</h2>
                        <p className="text-muted-foreground">Fill in the details below to register insurance information.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-3xl space-y-6">
                    {/* Customer Details Card */}
                    {customerId && customer && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    Customer Information
                                </CardTitle>
                                <CardDescription>
                                    Adding insurance for this customer
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                            {customer.full_name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <UserCircle className="h-4 w-4 text-muted-foreground" />
                                                Full Name
                                            </div>
                                            <p className="text-sm">{customer.full_name}</p>
                                        </div>
                                        {customer.email && (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    Email
                                                </div>
                                                <p className="text-sm">{customer.email}</p>
                                            </div>
                                        )}
                                        {customer.phone && (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    Phone
                                                </div>
                                                <p className="text-sm">{customer.phone}</p>
                                            </div>
                                        )}
                                        {customer.passport_no && (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    Passport No
                                                </div>
                                                <p className="text-sm">{customer.passport_no}</p>
                                            </div>
                                        )}
                                        {customer.nationality && (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                                    Nationality
                                                </div>
                                                <p className="text-sm">{customer.nationality}</p>
                                            </div>
                                        )}
                                        {customer.date_of_birth && (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    Date of Birth
                                                </div>
                                                <p className="text-sm">{customer.date_of_birth}</p>
                                            </div>
                                        )}
                                        {customer.gender && (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                                                    Gender
                                                </div>
                                                <p className="text-sm">{customer.gender}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {customerId && loadingCustomer && (
                        <Card>
                            <CardContent className="py-6">
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Existing Insurance Warning */}
                    {customerId && existingInsurance && (
                        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-yellow-600" />
                                    Existing Insurance Found
                                </CardTitle>
                                <CardDescription>
                                    This customer already has an insurance record. You can edit it instead.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start justify-between p-4 rounded-lg border bg-white dark:bg-gray-800">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-primary" />
                                            <h4 className="font-semibold text-sm">{existingInsurance.insurance_provider || "N/A"}</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                                            {existingInsurance.insurance_no && (
                                                <div className="flex items-center gap-1">
                                                    <FileText className="h-3 w-3" />
                                                    <span>Policy No: {existingInsurance.insurance_no}</span>
                                                </div>
                                            )}
                                            {existingInsurance.expiry_date && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>Expires: {format(new Date(existingInsurance.expiry_date), "MMM dd, yyyy")}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Link href={`/dashboard/customer-insurances/${existingInsurance.id}/edit?customer_id=${customerId}`}>
                                        <Button variant="outline" size="sm" className="h-8">
                                            <ExternalLink className="h-3 w-3 mr-1" />
                                            Edit
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {customerId && loadingInsurance && (
                        <Card>
                            <CardContent className="py-6">
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <CustomerInsuranceForm 
                        initialData={initialData} 
                        disableCustomerSelect={!!customerId}
                        redirectToCustomer={!!customerId}
                    />
                </div>
            </div>
        </div>
    );
}

export default function CreateCustomerInsurancePage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="New Insurance" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        }>
            <CreateCustomerInsuranceContent />
        </Suspense>
    );
}

