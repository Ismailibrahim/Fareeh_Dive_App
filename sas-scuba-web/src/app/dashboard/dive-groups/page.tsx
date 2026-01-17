"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { DiveGroup, diveGroupService } from "@/lib/api/services/dive-group.service";
import { PaginatedResponse } from "@/lib/api/services/customer.service";
import { Pagination } from "@/components/ui/pagination";
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
import { Search, MoreHorizontal, Users, Plus, Trash2, Edit, Eye, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DiveGroupsPage() {
    const [groups, setGroups] = useState<DiveGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [agentFilter, setAgentFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        per_page: 20,
        last_page: 1,
        current_page: 1,
    });

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<DiveGroup | null>(null);

    const fetchGroups = useCallback(async (page = 1, search = "", status = "", agentId = "") => {
        setLoading(true);
        try {
            const response = await diveGroupService.getAll({
                page,
                per_page: 20,
                search: search || undefined,
                status: status && status !== "all" ? status as any : undefined,
                agent_id: agentId && agentId !== "all" ? parseInt(agentId) : undefined,
            });
            
            if (response.data && Array.isArray(response.data)) {
                setGroups(response.data);
                setPagination({
                    total: response.total || 0,
                    per_page: response.per_page || 20,
                    last_page: response.last_page || 1,
                    current_page: response.current_page || page,
                });
            } else {
                const groupList = Array.isArray(response) ? response : (response as any).data || [];
                setGroups(groupList);
            }
        } catch (error) {
            console.error("Failed to fetch dive groups", error);
            setGroups([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGroups(1, "", statusFilter, agentFilter);
    }, [fetchGroups]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setCurrentPage(1);
            fetchGroups(1, searchTerm, statusFilter, agentFilter);
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [searchTerm, statusFilter, agentFilter, fetchGroups]);

    const handleDeleteClick = (group: DiveGroup) => {
        setGroupToDelete(group);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!groupToDelete) return;
        try {
            await diveGroupService.delete(groupToDelete.id);
            fetchGroups(currentPage, searchTerm, statusFilter, agentFilter);
        } catch (error) {
            console.error("Failed to delete dive group", error);
            alert("Failed to delete dive group. Make sure there are no bookings associated.");
        } finally {
            setDeleteDialogOpen(false);
            setGroupToDelete(null);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Dive Groups" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Dive Groups</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/dive-groups/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Create Group
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search groups..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : groups.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No dive groups found</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Get started by creating a new dive group.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Group Name</TableHead>
                                        <TableHead>Agent</TableHead>
                                        <TableHead>Members</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groups.map((group) => (
                                        <TableRow key={group.id}>
                                            <TableCell className="font-medium">
                                                {group.group_name}
                                            </TableCell>
                                            <TableCell>
                                                {group.agent ? (
                                                    <Link
                                                        href={`/dashboard/agents/${group.agent.id}`}
                                                        className="text-primary hover:underline"
                                                    >
                                                        {group.agent.agent_name}
                                                    </Link>
                                                ) : (
                                                    <span className="text-muted-foreground">No agent</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {group.member_count || group.members?.length || 0} members
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={group.status === "Active" ? "default" : "secondary"}
                                                >
                                                    {group.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(group.created_at).toLocaleDateString()}
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
                                                            <Link href={`/dashboard/dive-groups/${group.id}`}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/dashboard/dive-groups/${group.id}/edit`}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteClick(group)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {pagination.last_page > 1 && (
                            <Pagination
                                currentPage={pagination.current_page}
                                totalPages={pagination.last_page}
                                onPageChange={(page) => {
                                    setCurrentPage(page);
                                    fetchGroups(page, searchTerm, statusFilter, agentFilter);
                                }}
                            />
                        )}
                    </>
                )}
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the dive group "{groupToDelete?.group_name}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

