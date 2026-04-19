"use client";

import { useState, useEffect } from "react";
import { waiverService, Waiver } from "@/lib/api/services/waiver.service";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, Trash2, FileText, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageLoader } from "@/components/ui/page-loader";

export function WaiversList() {
    const [waivers, setWaivers] = useState<Waiver[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [waiverToDelete, setWaiverToDelete] = useState<Waiver | null>(null);

    useEffect(() => {
        loadWaivers();
    }, []);

    const loadWaivers = async () => {
        setLoading(true);
        try {
            const response = await waiverService.getAll();
            // The service returns { success: true, data: Waiver[] }
            const waiversData = response?.data || [];
            setWaivers(Array.isArray(waiversData) ? waiversData : []);
        } catch (error: any) {
            console.error("Failed to load waivers", error);
            // Check if it's a network error
            if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
                toast.error("Cannot connect to server. Please ensure the backend API is running on http://localhost:8000");
            } else {
                toast.error(error.response?.data?.message || "Failed to load waivers");
            }
            // Ensure waivers is always an array even on error
            setWaivers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!waiverToDelete) return;

        try {
            await waiverService.delete(waiverToDelete.id);
            toast.success("Waiver deleted successfully");
            loadWaivers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete waiver");
        } finally {
            setDeleteDialogOpen(false);
            setWaiverToDelete(null);
        }
    };

    const filteredWaivers = Array.isArray(waivers) ? waivers.filter((waiver) =>
        waiver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        waiver.type.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    const getTypeBadgeVariant = (type: string) => {
        switch (type) {
            case "liability":
                return "destructive";
            case "medical":
                return "default";
            case "checklist":
                return "secondary";
            default:
                return "outline";
        }
    };

    if (loading) {
        return <PageLoader />;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search waivers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
                <Link href="/dashboard/waivers/create">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Waiver
                    </Button>
                </Link>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Requires Signature</TableHead>
                            <TableHead>Expiry Days</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredWaivers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No waivers found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredWaivers.map((waiver) => (
                                <TableRow key={waiver.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            {waiver.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getTypeBadgeVariant(waiver.type)}>
                                            {waiver.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {waiver.requires_signature ? (
                                            <Badge variant="outline">Yes</Badge>
                                        ) : (
                                            <Badge variant="secondary">No</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {waiver.expiry_days ? `${waiver.expiry_days} days` : "No expiry"}
                                    </TableCell>
                                    <TableCell>
                                        {waiver.is_active ? (
                                            <Badge variant="default">Active</Badge>
                                        ) : (
                                            <Badge variant="secondary">Inactive</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/waivers/${waiver.id}/edit`}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/waivers/${waiver.id}/sign`}>
                                                        <FileText className="h-4 w-4 mr-2" />
                                                        Sign Waiver
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setWaiverToDelete(waiver);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
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

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete the waiver "{waiverToDelete?.name}". This action cannot be undone.
                            <span className="block mt-2 text-muted-foreground">
                                Note: If this waiver has existing signatures, it will be archived instead of deleted.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
