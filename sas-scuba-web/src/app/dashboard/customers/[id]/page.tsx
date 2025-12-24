"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, Mail, Phone, FileText, Globe, Calendar, UserCircle, Edit, MapPin, Plane } from "lucide-react";
import { EmergencyContactsSection } from "@/components/customers/EmergencyContactsSection";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCustomer } from "@/lib/hooks/use-customers";
import { CustomerCertificationsSection } from "@/components/customers/CustomerCertificationsSection";
import { CustomerInsuranceSection } from "@/components/customers/CustomerInsuranceSection";
import { CustomerAccommodationSection } from "@/components/customers/CustomerAccommodationSection";
import { safeFormatDate } from "@/lib/utils/date-format";

export default function CustomerDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { data: customer, isLoading, error } = useCustomer(id);

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Customer Details" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (error || !customer) {
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
                                <div className="flex-1 space-y-6">
                                    {/* Personal Information Section */}
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-3">
                                            <UserCircle className="h-4 w-4" />
                                            Personal Information
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                                                    Full Name
                                                </div>
                                                <p className="text-sm">{customer.full_name}</p>
                                            </div>
                                            {customer.gender && (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm font-medium">
                                                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                                                        Gender
                                                    </div>
                                                    <p className="text-sm">{customer.gender}</p>
                                                </div>
                                            )}
                                            {customer.date_of_birth && (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm font-medium">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        Date of Birth
                                                    </div>
                                                    <p className="text-sm">{safeFormatDate(customer.date_of_birth, "MMM d, yyyy", "N/A")}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contact Information Section */}
                                    {(customer.email || customer.phone) && (
                                        <div className="pt-4 border-t">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-3">
                                                <Mail className="h-4 w-4" />
                                                Contact Information
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            </div>
                                        </div>
                                    )}

                                    {/* Address Information Section */}
                                    {(customer.address || customer.city || customer.zip_code || customer.country) && (
                                        <div className="pt-4 border-t">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-3">
                                                <MapPin className="h-4 w-4" />
                                                Address Information
                                            </div>
                                            <div className="space-y-4">
                                                {customer.address && (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm font-medium">
                                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                                            Address
                                                        </div>
                                                        <p className="text-sm">{customer.address}</p>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {customer.city && (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                                City
                                                            </div>
                                                            <p className="text-sm">{customer.city}</p>
                                                        </div>
                                                    )}
                                                    {customer.zip_code && (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                                Zip Code
                                                            </div>
                                                            <p className="text-sm">{customer.zip_code}</p>
                                                        </div>
                                                    )}
                                                    {customer.country && (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                                <Globe className="h-4 w-4 text-muted-foreground" />
                                                                Country
                                                            </div>
                                                            <p className="text-sm">{customer.country}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Travel Documents Section */}
                                    {(customer.passport_no || customer.nationality || customer.gender) && (
                                        <div className="pt-4 border-t">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-3">
                                                <FileText className="h-4 w-4" />
                                                Travel Documents
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {customer.passport_no && (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm font-medium">
                                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                                            Passport No
                                                        </div>
                                                        <p className="text-sm">{customer.passport_no}</p>
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
                                                {customer.nationality && (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm font-medium">
                                                            <Globe className="h-4 w-4 text-muted-foreground" />
                                                            Nationality
                                                        </div>
                                                        <p className="text-sm">{customer.nationality}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Departure Information Section */}
                                    {(customer.departure_date || customer.departure_flight || customer.departure_flight_time || customer.departure_to) && (
                                        <div className="pt-4 border-t">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-3">
                                                <Plane className="h-4 w-4" />
                                                Departure Information
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {customer.departure_date && (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm font-medium">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            Departure Date
                                                        </div>
                                                        <p className="text-sm">{safeFormatDate(customer.departure_date, "MMM d, yyyy", "N/A")}</p>
                                                    </div>
                                                )}
                                                {customer.departure_flight && (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm font-medium">
                                                            <Plane className="h-4 w-4 text-muted-foreground" />
                                                            Departure Flight
                                                        </div>
                                                        <p className="text-sm">{customer.departure_flight}</p>
                                                    </div>
                                                )}
                                                {customer.departure_flight_time && (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm font-medium">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            Flight Time
                                                        </div>
                                                        <p className="text-sm">{customer.departure_flight_time}</p>
                                                    </div>
                                                )}
                                                {customer.departure_to && (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm font-medium">
                                                            <Globe className="h-4 w-4 text-muted-foreground" />
                                                            Departure To
                                                        </div>
                                                        <p className="text-sm">{customer.departure_to}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Emergency Contacts Section */}
                    <EmergencyContactsSection customerId={id} />

                    {/* Certifications Section */}
                    <CustomerCertificationsSection customerId={id} customer={customer} />

                    {/* Insurance Section */}
                    <CustomerInsuranceSection customerId={id} />

                    {/* Accommodation Section */}
                    <CustomerAccommodationSection customerId={id} />
                </div>
            </div>
        </div>
    );
}

