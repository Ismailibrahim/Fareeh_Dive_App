"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Agent, agentService, PaginatedResponse } from "@/lib/api/services/agent.service";
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
import { Search, MoreHorizontal, Building2, Plus, Trash2, Edit, Eye, Badge as BadgeIcon } from "lucide-react";
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

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        per_page: 20,
        last_page: 1,
        current_page: 1,
    });

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

    const fetchAgents = useCallback(async (page = 1, search = "", status = "", type = "") => {
        setLoading(true);
        try {
            const response = await agentService.getAll({
                page,
                per_page: 20,
                search: search || undefined,
                status: status && status !== "all" ? status as any : undefined,
                agent_type: type && type !== "all" ? type as any : undefined,
            });
            
            if (response.data && Array.isArray(response.data)) {
                setAgents(response.data);
                setPagination({
                    total: response.total || 0,
                    per_page: response.per_page || 20,
                    last_page: response.last_page || 1,
                    current_page: response.current_page || page,
                });
            } else {
                const agentList = Array.isArray(response) ? response : (response as any).data || [];
                setAgents(agentList);
            }
        } catch (error) {
            console.error("Failed to fetch agents", error);
            setAgents([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAgents(1, "", statusFilter, typeFilter);
    }, [fetchAgents]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setCurrentPage(1);
            fetchAgents(1, searchTerm, statusFilter, typeFilter);
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [searchTerm, statusFilter, typeFilter, fetchAgents]);

    const handleDeleteClick = (agent: Agent) => {
        setAgentToDelete(agent);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!agentToDelete) return;
        try {
            await agentService.delete(agentToDelete.id);
            fetchAgents(currentPage, searchTerm, statusFilter, typeFilter);
        } catch (error) {
            console.error("Failed to delete agent", error);
            alert("Failed to delete agent. Make sure there are no bookings or invoices associated.");
        } finally {
            setDeleteDialogOpen(false);
            setAgentToDelete(null);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Agents" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Agents</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/agents/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Agent
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search agents..."
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
                            <SelectItem value="Suspended">Suspended</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="Travel Agent">Travel Agent</SelectItem>
                            <SelectItem value="Resort / Guest House">Resort / Guest House</SelectItem>
                            <SelectItem value="Tour Operator">Tour Operator</SelectItem>
                            <SelectItem value="Freelancer">Freelancer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="rounded-md border hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Agent Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Performance</TableHead>
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
                            ) : agents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No agents found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                agents.map((agent) => (
                                    <TableRow key={agent.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                {agent.agent_name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{agent.agent_type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div>{agent.city}</div>
                                                <div className="text-muted-foreground">{agent.country}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={agent.status === 'Active' ? 'default' : 'secondary'}>
                                                {agent.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {agent.contacts?.[0] ? (
                                                <div className="text-sm">
                                                    <div>{agent.contacts[0].email}</div>
                                                    <div className="text-muted-foreground">{agent.contacts[0].phone}</div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div>Clients: {agent.total_clients_referred || 0}</div>
                                                <div className="text-muted-foreground">Revenue: ${agent.total_revenue_generated?.toFixed(2) || '0.00'}</div>
                                            </div>
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
                                                        <Link href={`/dashboard/agents/${agent.id}`} className="cursor-pointer flex w-full items-center">
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/agents/${agent.id}/edit`} className="cursor-pointer flex w-full items-center">
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/agents/${agent.id}/reports`} className="cursor-pointer flex w-full items-center">
                                                            <BadgeIcon className="mr-2 h-4 w-4" />
                                                            Reports
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                                                        onSelect={(e) => {
                                                            e.preventDefault();
                                                            handleDeleteClick(agent);
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
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

                {pagination.last_page > 1 && (
                    <div className="flex justify-center">
                        <Pagination
                            currentPage={pagination.current_page}
                            totalPages={pagination.last_page}
                            onPageChange={(page) => {
                                setCurrentPage(page);
                                fetchAgents(page, searchTerm, statusFilter, typeFilter);
                            }}
                            itemsPerPage={pagination.per_page}
                            totalItems={pagination.total}
                        />
                    </div>
                )}

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {loading ? (
                        <div className="text-center p-4">Loading...</div>
                    ) : agents.length === 0 ? (
                        <div className="text-center p-4 border rounded-md bg-muted/50">No agents found.</div>
                    ) : (
                        agents.map((agent) => (
                            <div key={agent.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Building2 className="h-8 w-8 text-primary" />
                                        <div>
                                            <h3 className="font-semibold leading-none tracking-tight">{agent.agent_name}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">{agent.agent_type}</p>
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
                                                <Link href={`/dashboard/agents/${agent.id}`}>View</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/agents/${agent.id}/edit`}>Edit</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onSelect={(e) => {
                                                    e.preventDefault();
                                                    handleDeleteClick(agent);
                                                }}
                                            >
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Location</span>
                                        <span>{agent.city}, {agent.country}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Status</span>
                                        <Badge variant={agent.status === 'Active' ? 'default' : 'secondary'}>
                                            {agent.status}
                                        </Badge>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Contact</span>
                                        <span>{agent.contacts?.[0]?.email || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Clients</span>
                                        <span>{agent.total_clients_referred || 0}</span>
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
                            This action cannot be undone. This will permanently delete the agent
                            <strong> {agentToDelete?.agent_name} </strong>
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

