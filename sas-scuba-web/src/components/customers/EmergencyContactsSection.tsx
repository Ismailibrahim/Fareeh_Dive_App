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
import { AlertCircle, ChevronDown, Plus, Edit, Trash2, Phone, Mail, MapPin, Users, Star } from "lucide-react";
import { EmergencyContact } from "@/lib/api/services/emergency-contact.service";
import { useEmergencyContacts, useDeleteEmergencyContact } from "@/lib/hooks/use-emergency-contacts";
import Link from "next/link";

interface EmergencyContactsSectionProps {
    customerId: string | number;
}

export function EmergencyContactsSection({ customerId }: EmergencyContactsSectionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<EmergencyContact | null>(null);

    const { data: contactsData, isLoading } = useEmergencyContacts(customerId);
    const deleteMutation = useDeleteEmergencyContact();

    const contacts = Array.isArray(contactsData) ? contactsData : [];

    const handleDeleteClick = (contact: EmergencyContact) => {
        setContactToDelete(contact);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!contactToDelete) return;
        try {
            await deleteMutation.mutateAsync({ customerId, id: contactToDelete.id });
            setDeleteDialogOpen(false);
            setContactToDelete(null);
        } catch (error) {
            console.error("Failed to delete emergency contact", error);
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
                                    <AlertCircle className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-xl">Emergency Contacts</CardTitle>
                                    <Badge variant="secondary">{contacts.length}</Badge>
                                </div>
                                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                            </div>
                            <CardDescription>
                                Manage customer emergency contacts
                            </CardDescription>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="space-y-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                </div>
                            ) : contacts.length === 0 ? (
                                <div className="text-center py-8 space-y-4">
                                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                                    <div>
                                        <p className="text-sm font-medium">No emergency contacts yet</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Add the first emergency contact for this customer
                                        </p>
                                    </div>
                                    <Link href={`/dashboard/emergency-contacts/create?customer_id=${customerId}`}>
                                        <Button size="sm">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Emergency Contact
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        {contacts.map((contact) => (
                                            <div
                                                key={contact.id}
                                                className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <AlertCircle className="h-4 w-4 text-primary" />
                                                        <h4 className="font-semibold text-sm">{contact.name || "Unnamed Contact"}</h4>
                                                        {contact.is_primary && (
                                                            <Badge variant="default" className="gap-1 text-xs">
                                                                <Star className="h-3 w-3 fill-current" />
                                                                Primary
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                                        {contact.phone_1 && (
                                                            <div className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3 text-muted-foreground" />
                                                                <span className="text-foreground"><span className="font-medium text-black dark:text-white">Phone 1:</span> {contact.phone_1}</span>
                                                            </div>
                                                        )}
                                                        {contact.phone_2 && (
                                                            <div className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3 text-muted-foreground" />
                                                                <span className="text-foreground"><span className="font-medium text-black dark:text-white">Phone 2:</span> {contact.phone_2}</span>
                                                            </div>
                                                        )}
                                                        {contact.phone_3 && (
                                                            <div className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3 text-muted-foreground" />
                                                                <span className="text-foreground"><span className="font-medium text-black dark:text-white">Phone 3:</span> {contact.phone_3}</span>
                                                            </div>
                                                        )}
                                                        {contact.email && (
                                                            <div className="flex items-center gap-1">
                                                                <Mail className="h-3 w-3 text-muted-foreground" />
                                                                <span className="text-foreground"><span className="font-medium text-black dark:text-white">Email:</span> {contact.email}</span>
                                                            </div>
                                                        )}
                                                        {contact.relationship && (
                                                            <div className="flex items-center gap-1">
                                                                <Users className="h-3 w-3 text-muted-foreground" />
                                                                <span className="text-foreground"><span className="font-medium text-black dark:text-white">Relationship:</span> {contact.relationship}</span>
                                                            </div>
                                                        )}
                                                        {contact.address && (
                                                            <div className="flex items-center gap-1 md:col-span-2">
                                                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                                                <span className="text-foreground"><span className="font-medium text-black dark:text-white">Address:</span> {contact.address}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <Link href={`/dashboard/emergency-contacts/${contact.id}/edit?customer_id=${customerId}`}>
                                                        <Button variant="ghost" size="sm" className="h-8">
                                                            <Edit className="h-3 w-3 mr-1" />
                                                            Edit
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDeleteClick(contact)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-2">
                                        <Link href={`/dashboard/emergency-contacts/create?customer_id=${customerId}`}>
                                            <Button variant="outline" className="w-full">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Emergency Contact
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
                            This action cannot be undone. This will permanently delete the emergency contact
                            {contactToDelete && (
                                <> <strong>{contactToDelete.name || "Unnamed Contact"}</strong></>
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

