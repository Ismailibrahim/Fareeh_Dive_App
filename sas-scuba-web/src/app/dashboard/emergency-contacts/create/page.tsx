"use client";

import { Header } from "@/components/layout/Header";
import { EmergencyContactForm } from "@/components/customers/EmergencyContactForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, Mail, Phone, FileText, Globe, Calendar, UserCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { customerService, Customer } from "@/lib/api/services/customer.service";
import { emergencyContactService, EmergencyContact } from "@/lib/api/services/emergency-contact.service";

function CreateEmergencyContactContent() {
    const searchParams = useSearchParams();
    const customerId = searchParams.get('customer_id');
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loadingCustomer, setLoadingCustomer] = useState(false);
    const [existingContacts, setExistingContacts] = useState<EmergencyContact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(false);

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

            // Fetch existing emergency contacts for this customer
            setLoadingContacts(true);
            emergencyContactService.getAll(parseInt(customerId))
                .then((data) => {
                    const contacts = Array.isArray(data) ? data : [];
                    setExistingContacts(contacts);
                })
                .catch((error) => {
                    console.error("Failed to fetch emergency contacts", error);
                })
                .finally(() => {
                    setLoadingContacts(false);
                });
        }
    }, [customerId]);

    const handleSave = () => {
        // Redirect back to customer page or emergency contacts list
        window.location.href = customerId ? `/dashboard/customers/${customerId}` : '/dashboard/emergency-contacts';
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="New Emergency Contact" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href={customerId ? `/dashboard/customers` : "/dashboard/emergency-contacts"}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Add New Emergency Contact</h2>
                        <p className="text-muted-foreground">Fill in the details below to add a new emergency contact.</p>
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
                                    Adding emergency contact for this customer
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
                                <div className="animate-pulse text-center text-muted-foreground">Loading customer details...</div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Existing Emergency Contacts */}
                    {customerId && existingContacts.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-primary" />
                                    Existing Emergency Contacts
                                </CardTitle>
                                <CardDescription>
                                    This customer already has {existingContacts.length} emergency contact{existingContacts.length !== 1 ? 's' : ''} registered.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {existingContacts.map((contact) => (
                                        <div 
                                            key={contact.id} 
                                            className="flex items-start justify-between p-4 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
                                        >
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4 text-primary" />
                                                    <h4 className="font-semibold text-sm">{contact.name || "Unnamed Contact"}</h4>
                                                    {contact.is_primary && (
                                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Primary</span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                    {contact.phone_1 && (
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {contact.phone_1}
                                                        </div>
                                                    )}
                                                    {contact.email && (
                                                        <div className="flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {contact.email}
                                                        </div>
                                                    )}
                                                    {contact.relationship && (
                                                        <div className="flex items-center gap-1">
                                                            <UserCircle className="h-3 w-3" />
                                                            {contact.relationship}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {customerId && loadingContacts && (
                        <Card>
                            <CardContent className="py-6">
                                <div className="animate-pulse text-center text-muted-foreground">Loading existing contacts...</div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Emergency Contact Form */}
                    <EmergencyContactForm
                        customerId={customerId || ""}
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

export default function CreateEmergencyContactPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="New Emergency Contact" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        }>
            <CreateEmergencyContactContent />
        </Suspense>
    );
}

