"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreHorizontal, Plus, Award } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { CustomerCertification, customerCertificationService } from "@/lib/api/services/customer-certification.service";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function CustomerCertificationsPage() {
    const [certifications, setCertifications] = useState<CustomerCertification[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [certToDelete, setCertToDelete] = useState<CustomerCertification | null>(null);

    const fetchCertifications = async () => {
        setLoading(true);
        try {
            const data = await customerCertificationService.getAll();
            setCertifications(data);
        } catch (error) {
            console.error("Failed to fetch certifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCertifications();
    }, []);

    const handleDeleteClick = (cert: CustomerCertification) => {
        setCertToDelete(cert);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!certToDelete) return;
        try {
            await customerCertificationService.delete(certToDelete.id);
            setCertifications(certifications.filter(c => c.id !== certToDelete.id));
        } catch (error) {
            console.error("Failed to delete certification", error);
        } finally {
            setDeleteDialogOpen(false);
            setCertToDelete(null);
        }
    };

    const filteredCerts = certifications.filter(cert =>
        cert.certification_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cert as any).customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.agency?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Customer Certifications" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Certifications</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/customer-certifications/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Certification
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search certifications..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="rounded-md border hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Certification</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Agency</TableHead>
                                <TableHead>Instructor</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredCerts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No certifications found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCerts.map((cert) => (
                                    <TableRow key={cert.id}>
                                        <TableCell className="font-medium">
                                            {(cert as any).customer?.full_name || "Unknown"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Award className="h-4 w-4 text-primary" />
                                                {cert.certification_name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(cert.certification_date), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{cert.agency || "N/A"}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {cert.instructor || "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/customer-certifications/${cert.id}/edit`} className="cursor-pointer flex w-full items-center">
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                                                        onSelect={() => handleDeleteClick(cert)}
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {loading ? (
                        <div className="text-center p-4">Loading...</div>
                    ) : filteredCerts.length === 0 ? (
                        <div className="text-center p-4 border rounded-md bg-muted/50">No certifications found.</div>
                    ) : (
                        filteredCerts.map((cert) => (
                            <div key={cert.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <Award className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold leading-none tracking-tight">{cert.certification_name}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">{(cert as any).customer?.full_name}</p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/customer-certifications/${cert.id}/edit`}>Edit</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onSelect={() => handleDeleteClick(cert)}
                                            >
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Date</span>
                                        <span>{format(new Date(cert.certification_date), "MMM d, yyyy")}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Agency</span>
                                        <span>{cert.agency || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the certification.
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
        </div>
    );
}
