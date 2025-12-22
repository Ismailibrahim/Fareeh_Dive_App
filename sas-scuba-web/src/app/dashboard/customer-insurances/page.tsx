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
import { Search, MoreHorizontal, Plus, Shield } from "lucide-react";
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
import { CustomerInsurance, customerInsuranceService } from "@/lib/api/services/customer-insurance.service";
import { safeFormatDate } from "@/lib/utils/date-format";
import { Badge } from "@/components/ui/badge";

export default function CustomerInsurancesPage() {
    const [insurances, setInsurances] = useState<CustomerInsurance[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [insuranceToDelete, setInsuranceToDelete] = useState<CustomerInsurance | null>(null);

    const fetchInsurances = async () => {
        setLoading(true);
        try {
            const data = await customerInsuranceService.getAll();
            setInsurances(data);
        } catch (error) {
            console.error("Failed to fetch insurances", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsurances();
    }, []);

    const handleDeleteClick = (insurance: CustomerInsurance) => {
        setInsuranceToDelete(insurance);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!insuranceToDelete) return;
        try {
            await customerInsuranceService.delete(insuranceToDelete.id);
            setInsurances(insurances.filter(i => i.id !== insuranceToDelete.id));
        } catch (error) {
            console.error("Failed to delete insurance", error);
        } finally {
            setDeleteDialogOpen(false);
            setInsuranceToDelete(null);
        }
    };

    const filteredInsurances = insurances.filter(insurance =>
        insurance.insurance_provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (insurance as any).customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insurance.insurance_no?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Customer Insurances" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Insurances</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/customer-insurances/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Insurance
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search insurances..."
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
                                <TableHead>Provider</TableHead>
                                <TableHead>Policy No</TableHead>
                                <TableHead>Hotline</TableHead>
                                <TableHead>Expiry Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredInsurances.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No insurances found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInsurances.map((insurance) => (
                                    <TableRow key={insurance.id}>
                                        <TableCell className="font-medium">
                                            {(insurance as any).customer?.full_name || "Unknown"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-primary" />
                                                {insurance.insurance_provider || "N/A"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {insurance.insurance_no || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {insurance.insurance_hotline_no || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {safeFormatDate(insurance.expiry_date, "MMM d, yyyy", "-")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={insurance.status ? "default" : "secondary"}>
                                                {insurance.status ? "Active" : "Inactive"}
                                            </Badge>
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
                                                        <Link href={`/dashboard/customer-insurances/${insurance.id}/edit`} className="cursor-pointer flex w-full items-center">
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                                                        onSelect={() => handleDeleteClick(insurance)}
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
                    ) : filteredInsurances.length === 0 ? (
                        <div className="text-center p-4 border rounded-md bg-muted/50">No insurances found.</div>
                    ) : (
                        filteredInsurances.map((insurance) => (
                            <div key={insurance.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <Shield className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold leading-none tracking-tight">{insurance.insurance_provider || "N/A"}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">{(insurance as any).customer?.full_name}</p>
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
                                                <Link href={`/dashboard/customer-insurances/${insurance.id}/edit`}>Edit</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onSelect={() => handleDeleteClick(insurance)}
                                            >
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Policy No</span>
                                        <span>{insurance.insurance_no || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Status</span>
                                        <Badge variant={insurance.status ? "default" : "secondary"} className="mt-1">
                                            {insurance.status ? "Active" : "Inactive"}
                                        </Badge>
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
                            This action cannot be undone. This will permanently delete the insurance record.
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

