"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Instructor, instructorService } from "@/lib/api/services/instructor.service";
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
import { Search, MoreHorizontal, Award, Plus, User } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export default function InstructorsPage() {
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [instructorToDelete, setInstructorToDelete] = useState<Instructor | null>(null);

    const fetchInstructors = async () => {
        setLoading(true);
        try {
            const data = await instructorService.getAll();
            const instructorList = Array.isArray(data) ? data : (data as any).data || [];
            setInstructors(instructorList);
        } catch (error) {
            console.error("Failed to fetch instructors", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstructors();
    }, []);

    const handleDeleteClick = (instructor: Instructor) => {
        setInstructorToDelete(instructor);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!instructorToDelete) return;
        try {
            await instructorService.delete(instructorToDelete.id);
            setInstructors(instructors.filter(i => i.id !== instructorToDelete.id));
        } catch (error) {
            console.error("Failed to delete instructor", error);
        } finally {
            setDeleteDialogOpen(false);
            setInstructorToDelete(null);
        }
    };

    const filteredInstructors = instructors.filter(instructor =>
        instructor.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.instructor_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.certification_agency?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Instructors" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Instructors</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/instructors/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Instructor
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search instructors..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="rounded-md border hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Avatar</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Instructor Number</TableHead>
                                <TableHead>Certification</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Availability</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredInstructors.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        No instructors found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInstructors.map((instructor) => (
                                    <TableRow key={instructor.id}>
                                        <TableCell>
                                            <Avatar>
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {instructor.user?.full_name?.substring(0, 2).toUpperCase() || "IN"}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {instructor.user?.full_name || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {instructor.instructor_number || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span className="font-medium">{instructor.certification_agency || "-"}</span>
                                                <span className="text-muted-foreground text-xs">{instructor.certification_level || "-"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span>{instructor.user?.email || "-"}</span>
                                                <span className="text-muted-foreground text-xs">{instructor.user?.phone || "-"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                instructor.instructor_status === 'Active' ? 'bg-green-100 text-green-800' :
                                                instructor.instructor_status === 'Suspended' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {instructor.instructor_status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                instructor.availability_status === 'Available' ? 'bg-blue-100 text-blue-800' :
                                                instructor.availability_status === 'Unavailable' ? 'bg-gray-100 text-gray-800' :
                                                'bg-orange-100 text-orange-800'
                                            }`}>
                                                {instructor.availability_status}
                                            </span>
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
                                                    <InstructorActions
                                                        instructorId={instructor.id}
                                                        onDelete={() => handleDeleteClick(instructor)}
                                                    />
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
                    ) : filteredInstructors.length === 0 ? (
                        <div className="text-center p-4 border rounded-md bg-muted/50">No instructors found.</div>
                    ) : (
                        filteredInstructors.map((instructor) => (
                            <div key={instructor.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {instructor.user?.full_name?.substring(0, 2).toUpperCase() || "IN"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold leading-none tracking-tight">{instructor.user?.full_name || "-"}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">{instructor.user?.email || "-"}</p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <InstructorActions
                                                instructorId={instructor.id}
                                                onDelete={() => handleDeleteClick(instructor)}
                                            />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Instructor #</span>
                                        <span>{instructor.instructor_number || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Agency</span>
                                        <span>{instructor.certification_agency || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Status</span>
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                                            instructor.instructor_status === 'Active' ? 'bg-green-100 text-green-800' :
                                            instructor.instructor_status === 'Suspended' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {instructor.instructor_status}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Availability</span>
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                                            instructor.availability_status === 'Available' ? 'bg-blue-100 text-blue-800' :
                                            instructor.availability_status === 'Unavailable' ? 'bg-gray-100 text-gray-800' :
                                            'bg-orange-100 text-orange-800'
                                        }`}>
                                            {instructor.availability_status}
                                        </span>
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
                            This action cannot be undone. This will permanently delete the instructor
                            <strong> {instructorToDelete?.user?.full_name} </strong>
                            and remove their data from our servers.
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

function InstructorActions({ instructorId, onDelete }: { instructorId: number | string, onDelete: () => void }) {
    return (
        <>
            <DropdownMenuItem asChild>
                <Link href={`/dashboard/instructors/${instructorId}/edit`} className="cursor-pointer flex w-full items-center">
                    Edit
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                onSelect={(e) => {
                    e.preventDefault();
                    onDelete();
                }}
            >
                Delete
            </DropdownMenuItem>
        </>
    );
}

