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
import { Building2, ChevronDown, Plus, Edit, Trash2, Phone, MapPin, Home, Key } from "lucide-react";
import { CustomerAccommodation } from "@/lib/api/services/customer-accommodation.service";
import { useCustomerAccommodations, useDeleteCustomerAccommodation } from "@/lib/hooks/use-customer-accommodations";
import Link from "next/link";

interface CustomerAccommodationSectionProps {
    customerId: number | string;
}

export function CustomerAccommodationSection({ customerId }: CustomerAccommodationSectionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const { data: accommodation, isLoading } = useCustomerAccommodations(customerId);
    const deleteMutation = useDeleteCustomerAccommodation();

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!accommodation) return;
        try {
            await deleteMutation.mutateAsync(accommodation.id);
            setDeleteDialogOpen(false);
        } catch (error) {
            console.error("Failed to delete accommodation", error);
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
                                    <Building2 className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-xl">Accommodation Details</CardTitle>
                                </div>
                                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                            </div>
                            <CardDescription>
                                Manage customer accommodation details
                            </CardDescription>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="space-y-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                </div>
                            ) : !accommodation ? (
                                <div className="text-center py-8 space-y-4">
                                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                                    <div>
                                        <p className="text-sm font-medium">No accommodation record yet</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Add accommodation details for this customer
                                        </p>
                                    </div>
                                    <Link href={`/dashboard/customer-accommodations/create?customer_id=${customerId}`}>
                                        <Button size="sm">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Accommodation
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 space-y-2">
                                                    {accommodation.name && (
                                                        <div className="flex items-center gap-2">
                                                            <Home className="h-4 w-4 text-primary" />
                                                            <h4 className="font-semibold text-sm">{accommodation.name}</h4>
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                        {accommodation.address && (
                                                            <div className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                <span>{accommodation.address}</span>
                                                            </div>
                                                        )}
                                                        {accommodation.contact_no && (
                                                            <div className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                <span>{accommodation.contact_no}</span>
                                                            </div>
                                                        )}
                                                        {accommodation.island && (
                                                            <div className="flex items-center gap-1">
                                                                <Building2 className="h-3 w-3" />
                                                                <span>Island: {accommodation.island}</span>
                                                            </div>
                                                        )}
                                                        {accommodation.room_no && (
                                                            <div className="flex items-center gap-1">
                                                                <Key className="h-3 w-3" />
                                                                <span>Room No: {accommodation.room_no}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <Link href={`/dashboard/customer-accommodations/${accommodation.id}/edit?customer_id=${customerId}`}>
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
                                        <Link href={`/dashboard/customer-accommodations/${accommodation.id}/edit?customer_id=${customerId}`}>
                                            <Button variant="outline" className="w-full">
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit Accommodation
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
                            This action cannot be undone. This will permanently delete the accommodation record
                            {accommodation && accommodation.name && (
                                <> for <strong>{accommodation.name}</strong></>
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

