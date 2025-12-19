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
import { Search, MoreHorizontal, Plus, AlertCircle, Star } from "lucide-react";
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
import { EmergencyContact, emergencyContactService } from "@/lib/api/services/emergency-contact.service";
import { Badge } from "@/components/ui/badge";

export default function EmergencyContactsPage() {
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<EmergencyContact | null>(null);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const data = await emergencyContactService.getAll();
            setContacts(data);
        } catch (error) {
            console.error("Failed to fetch emergency contacts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleDeleteClick = (contact: EmergencyContact) => {
        setContactToDelete(contact);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!contactToDelete) return;
        try {
            await emergencyContactService.delete(contactToDelete.customer_id, contactToDelete.id);
            setContacts(contacts.filter(c => c.id !== contactToDelete.id));
        } catch (error) {
            console.error("Failed to delete emergency contact", error);
        } finally {
            setDeleteDialogOpen(false);
            setContactToDelete(null);
        }
    };

    const filteredContacts = contacts.filter(contact =>
        contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact as any).customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.relationship?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone_1?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Emergency Contacts" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Emergency Contacts</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/emergency-contacts/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Emergency Contact
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search emergency contacts..."
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
                                <TableHead>Contact Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Relationship</TableHead>
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
                            ) : filteredContacts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No emergency contacts found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredContacts.map((contact) => (
                                    <TableRow key={contact.id}>
                                        <TableCell className="font-medium">
                                            {(contact as any).customer?.full_name || "Unknown"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4 text-primary" />
                                                {contact.name || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {contact.phone_1 || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {contact.email || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {contact.relationship || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {contact.is_primary && (
                                                <Badge variant="default" className="gap-1">
                                                    <Star className="h-3 w-3 fill-current" />
                                                    Primary
                                                </Badge>
                                            )}
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
                                                        <Link href={`/dashboard/emergency-contacts/${contact.id}/edit?customer_id=${contact.customer_id}`} className="cursor-pointer flex w-full items-center">
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/customers/${contact.customer_id}`} className="cursor-pointer flex w-full items-center">
                                                            View Customer
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                                                        onSelect={() => handleDeleteClick(contact)}
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
                    ) : filteredContacts.length === 0 ? (
                        <div className="text-center p-4 border rounded-md bg-muted/50">No emergency contacts found.</div>
                    ) : (
                        filteredContacts.map((contact) => (
                            <div key={contact.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <AlertCircle className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold leading-none tracking-tight">{contact.name || "Unnamed"}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">{(contact as any).customer?.full_name}</p>
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
                                                <Link href={`/dashboard/emergency-contacts/${contact.id}/edit?customer_id=${contact.customer_id}`}>Edit</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/customers/${contact.customer_id}`}>View Customer</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onSelect={() => handleDeleteClick(contact)}
                                            >
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Phone</span>
                                        <span>{contact.phone_1 || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Relationship</span>
                                        <span>{contact.relationship || "-"}</span>
                                    </div>
                                    {contact.is_primary && (
                                        <div className="col-span-2">
                                            <Badge variant="default" className="gap-1">
                                                <Star className="h-3 w-3 fill-current" />
                                                Primary Contact
                                            </Badge>
                                        </div>
                                    )}
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
                            This action cannot be undone. This will permanently delete the emergency contact.
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

