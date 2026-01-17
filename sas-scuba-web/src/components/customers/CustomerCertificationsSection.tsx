"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Award, ChevronDown, Plus, Edit, Trash2, Calendar, Building, UserCircle, FileText, Flag } from "lucide-react";
import { CustomerCertification } from "@/lib/api/services/customer-certification.service";
import { useCustomerCertifications, useDeleteCustomerCertification } from "@/lib/hooks/use-customer-certifications";
import { safeFormatDate } from "@/lib/utils/date-format";
import Link from "next/link";
import { Customer } from "@/lib/api/services/customer.service";

interface CustomerCertificationsSectionProps {
    customerId: number | string;
    customer?: Customer; // Optional customer data as fallback
}

export function CustomerCertificationsSection({ customerId, customer: customerProp }: CustomerCertificationsSectionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const { data: certification, isLoading } = useCustomerCertifications(customerId);
    const deleteMutation = useDeleteCustomerCertification();

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!certification) return;
        try {
            await deleteMutation.mutateAsync(certification.id);
            setDeleteDialogOpen(false);
        } catch (error) {
            console.error("Failed to delete certification", error);
        }
    };

    return (
        <>
            <Card>
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Award className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-xl">Certification Details</CardTitle>
                                </div>
                                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                            </div>
                            <CardDescription>
                                Manage customer certification details
                            </CardDescription>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="space-y-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                </div>
                            ) : !certification ? (
                                <div className="text-center py-8 space-y-4">
                                    <Award className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                                    <div>
                                        <p className="text-sm font-medium">No certification record yet</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Add certification details for this customer
                                        </p>
                                    </div>
                                    <Link href={`/dashboard/customer-certifications/create?customer_id=${customerId}`}>
                                        <Button size="sm">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Certification
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Award className="h-4 w-4 text-primary" />
                                                        <h4 className="font-semibold text-sm">{certification.certification_name}</h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                        {certification.certification_no && (
                                                            <div className="flex items-center gap-1">
                                                                <FileText className="h-3 w-3" />
                                                                <span>No: {certification.certification_no}</span>
                                                            </div>
                                                        )}
                                                        {certification.certification_date && (
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                <span>Certified: {safeFormatDate(certification.certification_date, "MMM dd, yyyy", "N/A")}</span>
                                                            </div>
                                                        )}
                                                        {certification.last_dive_date && (
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                <span>Last Dive: {safeFormatDate(certification.last_dive_date, "MMM dd, yyyy", "N/A")}</span>
                                                            </div>
                                                        )}
                                                        {certification.no_of_dives !== undefined && certification.no_of_dives !== null && (
                                                            <div className="flex items-center gap-1">
                                                                <Award className="h-3 w-3" />
                                                                <span>Dives: {certification.no_of_dives}</span>
                                                            </div>
                                                        )}
                                                        {certification.agency && (
                                                            <div className="flex items-center gap-1">
                                                                <Building className="h-3 w-3" />
                                                                <span>{certification.agency}</span>
                                                            </div>
                                                        )}
                                                        {certification.instructor && (
                                                            <div className="flex items-center gap-1">
                                                                <UserCircle className="h-3 w-3" />
                                                                <span>{certification.instructor}</span>
                                                            </div>
                                                        )}
                                                        {(certification.customer?.nationality || customerProp?.nationality) && (
                                                            <div className="flex items-center gap-1">
                                                                <Flag className="h-3 w-3" />
                                                                <span>Nationality: {certification.customer?.nationality || customerProp?.nationality}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <Link href={`/dashboard/customer-certifications/${certification.id}/edit?customer_id=${customerId}`}>
                                                        <Button variant="ghost" size="sm" className="h-8">
                                                            <Edit className="h-3 w-3 mr-1" />
                                                            Edit
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={handleDeleteClick}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <Link href={`/dashboard/customer-certifications/${certification.id}/edit?customer_id=${customerId}`}>
                                            <Button variant="outline" className="w-full">
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit Certification
                                            </Button>
                                        </Link>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the certification
                            {certification && (
                                <> <strong>{certification.certification_name}</strong></>
                            )}
                            and remove it from the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

