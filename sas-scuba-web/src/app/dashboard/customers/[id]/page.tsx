"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, Mail, Phone, FileText, Globe, Calendar, UserCircle, Edit } from "lucide-react";
import { EmergencyContactsSection } from "@/components/customers/EmergencyContactsSection";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { customerService, Customer } from "@/lib/api/services/customer.service";
import { CustomerCertificationsSection } from "@/components/customers/CustomerCertificationsSection";
import { CustomerInsuranceSection } from "@/components/customers/CustomerInsuranceSection";
import { CustomerAccommodationSection } from "@/components/customers/CustomerAccommodationSection";

export default function CustomerDetailPage() {
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
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Customer Details" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Customer Details" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-muted-foreground">Customer not found</p>
                        <Link href="/dashboard/customers">
                            <Button variant="outline" className="mt-4">
                                Back to Customers
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Customer Details" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/customers">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                                <span className="sr-only">Back</span>
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Customer Details</h2>
                            <p className="text-muted-foreground">View and manage customer information and certifications.</p>
                        </div>
                    </div>
                    <Link href={`/dashboard/customers/${id}/edit`}>
                        <Button>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Customer
                        </Button>
                    </Link>
                </div>

                <div className="mx-auto max-w-3xl space-y-6">
                    {/* Customer Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Customer Information
                            </CardTitle>
                            <CardDescription>
                                Personal and contact details
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

                    {/* Emergency Contacts Section */}
                    <EmergencyContactsSection customerId={id} />

                    {/* Certifications Section */}
                    <CustomerCertificationsSection customerId={id} />

                    {/* Insurance Section */}
                    <CustomerInsuranceSection customerId={id} />

                    {/* Accommodation Section */}
                    <CustomerAccommodationSection customerId={id} />
                </div>
            </div>
        </div>
    );
}

