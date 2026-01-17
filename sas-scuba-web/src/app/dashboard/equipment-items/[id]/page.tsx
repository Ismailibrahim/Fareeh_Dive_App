"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { equipmentItemService, EquipmentItem } from "@/lib/api/services/equipment-item.service";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Package, Calendar, User, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeFormatDate } from "@/lib/utils/date-format";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { BookingEquipment } from "@/lib/api/services/booking-equipment.service";

export default function EquipmentItemDetailPage() {
    const params = useParams();
    const itemId = params.id as string;
    const [equipmentItem, setEquipmentItem] = useState<EquipmentItem | null>(null);
    const [assignments, setAssignments] = useState<BookingEquipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeAssignments, setActiveAssignments] = useState(0);

    useEffect(() => {
        if (itemId) {
            loadData();
        }
    }, [itemId]);

    const loadData = async () => {
        try {
            const data = await equipmentItemService.getAssignmentHistory(itemId);
            setEquipmentItem(data.equipment_item);
            setAssignments(data.assignments || []);
            setActiveAssignments(data.active_assignments || 0);
        } catch (error) {
            console.error("Failed to load equipment item", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Equipment Item" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!equipmentItem) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Equipment Item" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-muted-foreground mb-4">Equipment item not found</p>
                        <Link href="/dashboard/equipment-items">
                            <Button variant="outline">Back to Equipment Items</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const currentAssignment = assignments.find(a => a.assignment_status !== 'Returned');

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Equipment Item" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/equipment-items">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                                <span className="sr-only">Back</span>
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">
                                {equipmentItem.equipment?.name || 'Equipment Item'}
                                {equipmentItem.size && ` - ${equipmentItem.size}`}
                            </h2>
                            <p className="text-muted-foreground">
                                {equipmentItem.serial_no && `SN: ${equipmentItem.serial_no}`}
                                {equipmentItem.serial_no && equipmentItem.inventory_code && ' • '}
                                {equipmentItem.inventory_code && `Code: ${equipmentItem.inventory_code}`}
                            </p>
                        </div>
                    </div>
                    <Link href={`/dashboard/equipment-items/${itemId}/edit`}>
                        <Button variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                    </Link>
                </div>

                {/* Current Assignment Alert */}
                {currentAssignment && (
                    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Currently Assigned
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p>
                                    <strong>Customer:</strong> {currentAssignment.basket?.customer?.full_name || 
                                                              currentAssignment.booking?.customer?.full_name || 
                                                              'N/A'}
                                </p>
                                {currentAssignment.basket && (
                                    <p>
                                        <strong>Basket:</strong>{' '}
                                        <Link 
                                            href={`/dashboard/baskets/${currentAssignment.basket_id}`}
                                            className="text-blue-600 hover:underline font-mono"
                                        >
                                            {currentAssignment.basket.basket_no}
                                        </Link>
                                    </p>
                                )}
                                <p>
                                    <strong>Checkout:</strong> {currentAssignment.checkout_date 
                                        ? safeFormatDate(currentAssignment.checkout_date, "MMM d, yyyy", "N/A")
                                        : "N/A"}
                                </p>
                                <p>
                                    <strong>Expected Return:</strong> {currentAssignment.return_date 
                                        ? safeFormatDate(currentAssignment.return_date, "MMM d, yyyy", "N/A")
                                        : "N/A"}
                                </p>
                                <Badge variant={currentAssignment.assignment_status === 'Checked Out' ? 'default' : 'outline'}>
                                    {currentAssignment.assignment_status}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Item Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Item Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                <p className="text-sm text-muted-foreground">Equipment Type</p>
                                <p className="font-medium">{equipmentItem.equipment?.name || 'N/A'}</p>
                            </div>
                            {equipmentItem.size && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Size</p>
                                    <p className="font-medium">{equipmentItem.size}</p>
                                </div>
                            )}
                            {equipmentItem.brand && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Brand</p>
                                    <p className="font-medium">{equipmentItem.brand}</p>
                                </div>
                            )}
                            {equipmentItem.serial_no && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Serial Number</p>
                                    <p className="font-medium font-mono">{equipmentItem.serial_no}</p>
                                </div>
                            )}
                            {equipmentItem.inventory_code && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Inventory Code</p>
                                    <p className="font-medium font-mono">{equipmentItem.inventory_code}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge variant={
                                    equipmentItem.status === 'Available' ? 'default' :
                                    equipmentItem.status === 'Rented' ? 'secondary' :
                                    'destructive'
                                }>
                                    {equipmentItem.status}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Assignment Statistics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Assignments</p>
                                <p className="text-2xl font-bold">{assignments.length}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Active Assignments</p>
                                <p className="text-2xl font-bold text-green-600">{activeAssignments}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Returned</p>
                                <p className="text-2xl font-bold text-gray-600">
                                    {assignments.filter(a => a.assignment_status === 'Returned').length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Assignment History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Assignment History</CardTitle>
                        <CardDescription>
                            All customers who have rented this equipment item
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {assignments.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                No assignment history available
                            </p>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Basket</TableHead>
                                            <TableHead>Checkout Date</TableHead>
                                            <TableHead>Return Date</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {assignments.map((assignment) => {
                                            const customerName = assignment.basket?.customer?.full_name || 
                                                               assignment.booking?.customer?.full_name || 
                                                               'N/A';
                                            return (
                                                <TableRow key={assignment.id}>
                                                    <TableCell className="font-medium">
                                                        {customerName}
                                                    </TableCell>
                                                    <TableCell>
                                                        {assignment.basket ? (
                                                            <Link 
                                                                href={`/dashboard/baskets/${assignment.basket_id}`}
                                                                className="text-blue-600 hover:underline font-mono text-sm"
                                                            >
                                                                {assignment.basket.basket_no}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-muted-foreground">N/A</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {assignment.checkout_date 
                                                            ? safeFormatDate(assignment.checkout_date, "MMM d, yyyy", "N/A")
                                                            : "N/A"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {assignment.return_date 
                                                            ? safeFormatDate(assignment.return_date, "MMM d, yyyy", "N/A")
                                                            : assignment.actual_return_date
                                                            ? safeFormatDate(assignment.actual_return_date, "MMM d, yyyy", "N/A")
                                                            : "N/A"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge 
                                                            variant={
                                                                assignment.assignment_status === 'Returned' ? 'secondary' :
                                                                assignment.assignment_status === 'Checked Out' ? 'default' :
                                                                assignment.assignment_status === 'Lost' ? 'destructive' :
                                                                'outline'
                                                            }
                                                        >
                                                            {assignment.assignment_status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

