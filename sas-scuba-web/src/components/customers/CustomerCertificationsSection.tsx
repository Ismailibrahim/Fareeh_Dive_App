"use client";

import { useState, useEffect } from "react";
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
import { Award, ChevronDown, Plus, Edit, Trash2, Calendar, Building, UserCircle, FileText } from "lucide-react";
import { CustomerCertification, customerCertificationService } from "@/lib/api/services/customer-certification.service";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CustomerCertificationsSectionProps {
    customerId: number | string;
}

export function CustomerCertificationsSection({ customerId }: CustomerCertificationsSectionProps) {
    const router = useRouter();
    const [certifications, setCertifications] = useState<CustomerCertification[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [certToDelete, setCertToDelete] = useState<CustomerCertification | null>(null);

    useEffect(() => {
        const fetchCertifications = async () => {
            setLoading(true);
            try {
                const data = await customerCertificationService.getAll(Number(customerId));
                const certs = Array.isArray(data) ? data : [];
                setCertifications(certs);
            } catch (error) {
                console.error("Failed to fetch certifications", error);
            } finally {
                setLoading(false);
            }
        };

        if (customerId) {
            fetchCertifications();
        }
    }, [customerId]);

    const handleDeleteClick = (cert: CustomerCertification) => {
        setCertToDelete(cert);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!certToDelete) return;
        try {
            await customerCertificationService.delete(certToDelete.id);
            // Refresh certifications list
            const data = await customerCertificationService.getAll(Number(customerId));
            const certs = Array.isArray(data) ? data : [];
            setCertifications(certs);
            router.refresh();
        } catch (error) {
            console.error("Failed to delete certification", error);
        } finally {
            setDeleteDialogOpen(false);
            setCertToDelete(null);
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
                                    <CardTitle className="text-xl">Certifications</CardTitle>
                                    <Badge variant="secondary">{certifications.length}</Badge>
                                </div>
                                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                            </div>
                            <CardDescription>
                                Manage customer certifications
                            </CardDescription>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="space-y-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                </div>
                            ) : certifications.length === 0 ? (
                                <div className="text-center py-8 space-y-4">
                                    <Award className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                                    <div>
                                        <p className="text-sm font-medium">No certifications yet</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Add the first certification for this customer
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
                                    <div className="space-y-3">
                                        {certifications.map((cert) => (
                                            <div
                                                key={cert.id}
                                                className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Award className="h-4 w-4 text-primary" />
                                                        <h4 className="font-semibold text-sm">{cert.certification_name}</h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                        {cert.certification_no && (
                                                            <div className="flex items-center gap-1">
                                                                <FileText className="h-3 w-3" />
                                                                <span>No: {cert.certification_no}</span>
                                                            </div>
                                                        )}
                                                        {cert.certification_date && (
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                <span>Certified: {format(new Date(cert.certification_date), "MMM dd, yyyy")}</span>
                                                            </div>
                                                        )}
                                                        {cert.expiry_date && (
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                <span>Expires: {format(new Date(cert.expiry_date), "MMM dd, yyyy")}</span>
                                                            </div>
                                                        )}
                                                        {cert.agency && (
                                                            <div className="flex items-center gap-1">
                                                                <Building className="h-3 w-3" />
                                                                <span>{cert.agency}</span>
                                                            </div>
                                                        )}
                                                        {cert.instructor && (
                                                            <div className="flex items-center gap-1">
                                                                <UserCircle className="h-3 w-3" />
                                                                <span>{cert.instructor}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <Link href={`/dashboard/customer-certifications/${cert.id}/edit?customer_id=${customerId}`}>
                                                        <Button variant="ghost" size="sm" className="h-8">
                                                            <Edit className="h-3 w-3 mr-1" />
                                                            Edit
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDeleteClick(cert)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-2">
                                        <Link href={`/dashboard/customer-certifications/create?customer_id=${customerId}`}>
                                            <Button variant="outline" className="w-full">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Certification
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
                            {certToDelete && (
                                <> <strong>{certToDelete.certification_name}</strong></>
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

