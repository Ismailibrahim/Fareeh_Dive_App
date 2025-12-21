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
import { Shield, ChevronDown, Plus, Edit, Trash2, Calendar, Phone, FileText, Building } from "lucide-react";
import { CustomerInsurance } from "@/lib/api/services/customer-insurance.service";
import { useCustomerInsurances, useDeleteCustomerInsurance } from "@/lib/hooks/use-customer-insurances";
import { format, isAfter, addDays } from "date-fns";
import Link from "next/link";

interface CustomerInsuranceSectionProps {
    customerId: number | string;
}

export function CustomerInsuranceSection({ customerId }: CustomerInsuranceSectionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const { data: insurance, isLoading } = useCustomerInsurances(customerId);
    const deleteMutation = useDeleteCustomerInsurance();

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!insurance) return;
        try {
            await deleteMutation.mutateAsync(insurance.id);
            setDeleteDialogOpen(false);
        } catch (error) {
            console.error("Failed to delete insurance", error);
        }
    };

    const getExpiryStatus = (expiryDate?: string) => {
        if (!expiryDate) return null;
        const expiry = new Date(expiryDate);
        const today = new Date();
        const thirtyDaysFromNow = addDays(today, 30);
        
        if (isAfter(today, expiry)) {
            return { status: 'expired', color: 'destructive' };
        } else if (isAfter(thirtyDaysFromNow, expiry)) {
            return { status: 'expiring', color: 'warning' };
        }
        return { status: 'valid', color: 'default' };
    };

    const expiryStatus = insurance?.expiry_date ? getExpiryStatus(insurance.expiry_date) : null;

    return (
        <>
            <Card>
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Shield className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-xl">Insurance</CardTitle>
                                    {insurance && (
                                        <Badge variant={insurance.status ? "default" : "secondary"}>
                                            {insurance.status ? "Active" : "Inactive"}
                                        </Badge>
                                    )}
                                </div>
                                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                            </div>
                            <CardDescription>
                                Manage customer insurance details
                            </CardDescription>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="space-y-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                </div>
                            ) : !insurance ? (
                                <div className="text-center py-8 space-y-4">
                                    <Shield className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                                    <div>
                                        <p className="text-sm font-medium">No insurance record yet</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Add insurance details for this customer
                                        </p>
                                    </div>
                                    <Link href={`/dashboard/customer-insurances/create?customer_id=${customerId}`}>
                                        <Button size="sm">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Insurance
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 space-y-2">
                                                    {insurance.insurance_provider && (
                                                        <div className="flex items-center gap-2">
                                                            <Building className="h-4 w-4 text-primary" />
                                                            <h4 className="font-semibold text-sm">{insurance.insurance_provider}</h4>
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                        {insurance.insurance_no && (
                                                            <div className="flex items-center gap-1">
                                                                <FileText className="h-3 w-3" />
                                                                <span>Policy No: {insurance.insurance_no}</span>
                                                            </div>
                                                        )}
                                                        {insurance.insurance_hotline_no && (
                                                            <div className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                <span>Hotline: {insurance.insurance_hotline_no}</span>
                                                            </div>
                                                        )}
                                                        {insurance.expiry_date && (
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                <span>
                                                                    Expires: {format(new Date(insurance.expiry_date), "MMM dd, yyyy")}
                                                                    {expiryStatus && expiryStatus.status === 'expired' && (
                                                                        <Badge variant="destructive" className="ml-2 text-xs">Expired</Badge>
                                                                    )}
                                                                    {expiryStatus && expiryStatus.status === 'expiring' && (
                                                                        <Badge variant="outline" className="ml-2 text-xs border-yellow-500 text-yellow-600">Expiring Soon</Badge>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {insurance.file_url && (
                                                            <div className="flex items-center gap-1">
                                                                <FileText className="h-3 w-3" />
                                                                <a 
                                                                    href={insurance.file_url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="text-primary hover:underline"
                                                                >
                                                                    View Document
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <Link href={`/dashboard/customer-insurances/${insurance.id}/edit?customer_id=${customerId}`}>
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
                                        <Link href={`/dashboard/customer-insurances/${insurance.id}/edit?customer_id=${customerId}`}>
                                            <Button variant="outline" className="w-full">
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit Insurance
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
                            This action cannot be undone. This will permanently delete the insurance record
                            {insurance && insurance.insurance_provider && (
                                <> for <strong>{insurance.insurance_provider}</strong></>
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

