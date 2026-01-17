"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Edit, Building2, Calendar, DollarSign, Plus, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DiveGroup, diveGroupService } from "@/lib/api/services/dive-group.service";
import { Badge } from "@/components/ui/badge";
import { safeFormatDate } from "@/lib/utils/date-format";
import { BookGroupDialog } from "@/components/dive-groups/BookGroupDialog";
import { BillAgentDialog } from "@/components/dive-groups/BillAgentDialog";
import { AddMemberDialog } from "@/components/dive-groups/AddMemberDialog";
import { DiveGroupMemberList } from "@/components/dive-groups/DiveGroupMemberList";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function DiveGroupDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [group, setGroup] = useState<DiveGroup | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookGroupDialogOpen, setBookGroupDialogOpen] = useState(false);
    const [billAgentDialogOpen, setBillAgentDialogOpen] = useState(false);
    const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);

    useEffect(() => {
        if (!id) return;
        loadGroup();
    }, [id]);

    const loadGroup = async () => {
        try {
            const data = await diveGroupService.getById(id);
            setGroup(data);
        } catch (error) {
            console.error("Failed to fetch dive group", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (customerId: number) => {
        if (!group) return;
        try {
            await diveGroupService.removeMember(group.id, customerId);
            loadGroup();
        } catch (error) {
            console.error("Failed to remove member", error);
            alert("Failed to remove member from group");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Dive Group Details" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Dive Group Details" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-muted-foreground">Dive group not found</p>
                        <Link href="/dashboard/dive-groups">
                            <Button variant="outline" className="mt-4">
                                Back to Dive Groups
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Dive Group Details" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/dive-groups">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                                <span className="sr-only">Back</span>
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">{group.group_name}</h2>
                            <p className="text-muted-foreground">Group information and members.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setBookGroupDialogOpen(true)}
                            disabled={group.status !== 'Active' || (group.member_count || 0) === 0}
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            Book Group
                        </Button>
                        {group.agent_id && (
                            <Button
                                variant="outline"
                                onClick={() => setBillAgentDialogOpen(true)}
                            >
                                <DollarSign className="h-4 w-4 mr-2" />
                                Bill Agent
                            </Button>
                        )}
                        <Link href={`/dashboard/dive-groups/${id}/edit`}>
                            <Button>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Group
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Group Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Group Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge variant={group.status === 'Active' ? 'default' : 'secondary'}>
                                    {group.status}
                                </Badge>
                            </div>
                            {group.agent && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Agent</p>
                                    <Link
                                        href={`/dashboard/agents/${group.agent.id}`}
                                        className="text-primary hover:underline font-medium"
                                    >
                                        {group.agent.agent_name}
                                    </Link>
                                </div>
                            )}
                            {group.description && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Description</p>
                                    <p className="text-sm">{group.description}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-muted-foreground">Created</p>
                                <p className="text-sm">{safeFormatDate(group.created_at, "MMM d, yyyy", "N/A")}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => setAddMemberDialogOpen(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Member
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => setBookGroupDialogOpen(true)}
                                disabled={group.status !== 'Active' || (group.member_count || 0) === 0}
                            >
                                <Calendar className="h-4 w-4 mr-2" />
                                Book Dives for Group
                            </Button>
                            {group.agent_id && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => setBillAgentDialogOpen(true)}
                                >
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Generate Invoice for Agent
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Members */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Members ({group.member_count || group.members?.length || 0})
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAddMemberDialogOpen(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Member
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DiveGroupMemberList
                            members={group.members || []}
                            onRemoveMember={handleRemoveMember}
                        />
                    </CardContent>
                </Card>

                {/* Related Bookings */}
                {group.bookings && group.bookings.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Related Bookings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Booking ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {group.bookings.map((booking) => (
                                        <TableRow key={booking.id}>
                                            <TableCell>#{booking.id}</TableCell>
                                            <TableCell>
                                                {booking.customer?.full_name || 'Unknown'}
                                            </TableCell>
                                            <TableCell>
                                                {booking.booking_date ? safeFormatDate(booking.booking_date, "MMM d, yyyy", "-") : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{booking.status}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/dashboard/bookings/${booking.id}`}>
                                                    <Button variant="ghost" size="sm">View</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Related Invoices */}
                {group.related_invoices && group.related_invoices.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Related Invoices</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice No</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {group.related_invoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell>{invoice.invoice_no}</TableCell>
                                            <TableCell>
                                                {invoice.invoice_date ? safeFormatDate(invoice.invoice_date, "MMM d, yyyy", "-") : '-'}
                                            </TableCell>
                                            <TableCell>${invoice.total?.toFixed(2) || '0.00'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{invoice.status}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/dashboard/invoices/${invoice.id}`}>
                                                    <Button variant="ghost" size="sm">View</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>

            {group && (
                <>
                    <BookGroupDialog
                        open={bookGroupDialogOpen}
                        onOpenChange={setBookGroupDialogOpen}
                        groupId={group.id}
                        onSuccess={loadGroup}
                    />
                    <BillAgentDialog
                        open={billAgentDialogOpen}
                        onOpenChange={setBillAgentDialogOpen}
                        groupId={group.id}
                        onSuccess={loadGroup}
                    />
                    <AddMemberDialog
                        open={addMemberDialogOpen}
                        onOpenChange={setAddMemberDialogOpen}
                        groupId={group.id}
                        onSuccess={loadGroup}
                    />
                </>
            )}
        </div>
    );
}

