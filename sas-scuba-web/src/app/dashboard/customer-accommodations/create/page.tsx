"use client";

import { Header } from "@/components/layout/Header";
import { CustomerAccommodationForm } from "@/components/customers/CustomerAccommodationForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, Mail, Phone, FileText, Globe, Calendar, UserCircle, Building2, Key } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { customerService, Customer } from "@/lib/api/services/customer.service";
import { CustomerAccommodation, customerAccommodationService } from "@/lib/api/services/customer-accommodation.service";

function CreateCustomerAccommodationContent() {
    const searchParams = useSearchParams();
    const customerId = searchParams.get('customer_id');
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loadingCustomer, setLoadingCustomer] = useState(false);
    const [existingAccommodation, setExistingAccommodation] = useState<CustomerAccommodation | null>(null);
    const [loadingAccommodation, setLoadingAccommodation] = useState(false);

    useEffect(() => {
        if (customerId) {
            // Fetch customer details
            setLoadingCustomer(true);
            customerService.getById(customerId)
                .then((data) => {
                    setCustomer(data);
                })
                .catch((error) => {
                    console.error("Failed to fetch customer", error);
                })
                .finally(() => {
                    setLoadingCustomer(false);
                });

            // Fetch existing accommodation for this customer (one-to-one relationship)
            setLoadingAccommodation(true);
            customerAccommodationService.getAll(parseInt(customerId))
                .then((data) => {
                    const accommodations = Array.isArray(data) ? data : [];
                    setExistingAccommodation(accommodations.length > 0 ? accommodations[0] : null);
                })
                .catch((error) => {
                    console.error("Failed to fetch accommodation", error);
                })
                .finally(() => {
                    setLoadingAccommodation(false);
                });
        }
    }, [customerId]);

    const handleSave = () => {
        // Redirect back to customer page
        window.location.href = customerId ? `/dashboard/customers/${customerId}` : '/dashboard/customers';
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="New Accommodation" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href={customerId ? `/dashboard/customers/${customerId}` : "/dashboard/customers"}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Add Accommodation Details</h2>
                        <p className="text-muted-foreground">Fill in the details below to add accommodation information.</p>
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
                                    Adding accommodation for this customer
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

                    {/* Existing Accommodation Warning */}
                    {customerId && existingAccommodation && (
                        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-yellow-600" />
                                    Existing Accommodation Found
                                </CardTitle>
                                <CardDescription>
                                    This customer already has an accommodation record. You can edit it instead.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start justify-between p-4 rounded-lg border bg-white dark:bg-gray-800">
                                    <div className="flex-1 space-y-2">
                                        {existingAccommodation.name && (
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-primary" />
                                                <h4 className="font-semibold text-sm">{existingAccommodation.name}</h4>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                                            {existingAccommodation.address && (
                                                <div className="flex items-center gap-1">
                                                    <FileText className="h-3 w-3" />
                                                    <span>{existingAccommodation.address}</span>
                                                </div>
                                            )}
                                            {existingAccommodation.island && (
                                                <div className="flex items-center gap-1">
                                                    <Building2 className="h-3 w-3" />
                                                    <span>Island: {existingAccommodation.island}</span>
                                                </div>
                                            )}
                                            {existingAccommodation.room_no && (
                                                <div className="flex items-center gap-1">
                                                    <Key className="h-3 w-3" />
                                                    <span>Room No: {existingAccommodation.room_no}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Link href={`/dashboard/customer-accommodations/${existingAccommodation.id}/edit?customer_id=${customerId}`}>
                                        <Button variant="outline" size="sm" className="h-8">
                                            Edit
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {customerId && loadingAccommodation && (
                        <Card>
                            <CardContent className="py-6">
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Accommodation Form */}
                    <CustomerAccommodationForm
                        customerId={customerId || ""}
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

export default function CreateCustomerAccommodationPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="New Accommodation" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        }>
            <CreateCustomerAccommodationContent />
        </Suspense>
    );
}

