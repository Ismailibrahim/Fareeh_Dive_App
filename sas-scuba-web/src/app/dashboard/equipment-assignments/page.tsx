"use client";

import { useEffect, useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { BookingEquipment, bookingEquipmentService } from "@/lib/api/services/booking-equipment.service";
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
import { Search, Download, FileSpreadsheet, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { safeFormatDate } from "@/lib/utils/date-format";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function EquipmentAssignmentsPage() {
    const [assignments, setAssignments] = useState<BookingEquipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [sourceFilter, setSourceFilter] = useState<string>("all");

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const data = await bookingEquipmentService.getAll();
            const assignmentList = Array.isArray(data) ? data : (data as any).data || [];
            setAssignments(assignmentList);
        } catch (error) {
            console.error("Failed to fetch equipment assignments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

    // Refresh data when page comes into focus
    useEffect(() => {
        const handleFocus = () => {
            fetchAssignments();
        };
        
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const filteredAssignments = useMemo(() => {
        return assignments.filter(assignment => {
            // Status filter
            if (statusFilter !== "all" && assignment.assignment_status !== statusFilter) {
                return false;
            }

            // Source filter
            if (sourceFilter !== "all" && assignment.equipment_source !== sourceFilter) {
                return false;
            }

            // Search filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch = 
                    assignment.basket?.customer?.full_name?.toLowerCase().includes(searchLower) ||
                    assignment.booking?.customer?.full_name?.toLowerCase().includes(searchLower) ||
                    assignment.equipment_item?.equipment?.name?.toLowerCase().includes(searchLower) ||
                    assignment.equipment_item?.serial_no?.toLowerCase().includes(searchLower) ||
                    assignment.equipment_item?.inventory_code?.toLowerCase().includes(searchLower) ||
                    assignment.customer_equipment_brand?.toLowerCase().includes(searchLower) ||
                    assignment.customer_equipment_type?.toLowerCase().includes(searchLower) ||
                    assignment.customer_equipment_serial?.toLowerCase().includes(searchLower) ||
                    assignment.basket?.basket_no?.toLowerCase().includes(searchLower);
                
                if (!matchesSearch) {
                    return false;
                }
            }

            return true;
        });
    }, [assignments, searchTerm, statusFilter, sourceFilter]);

    const activeAssignments = filteredAssignments.filter(a => a.assignment_status !== 'Returned');
    const returnedAssignments = filteredAssignments.filter(a => a.assignment_status === 'Returned');

    const handleExportCSV = () => {
        const headers = [
            'Customer',
            'Basket No',
            'Equipment',
            'Serial Number',
            'Inventory Code',
            'Source',
            'Checkout Date',
            'Return Date',
            'Status'
        ];

        const rows = filteredAssignments.map(assignment => {
            const customerName = assignment.basket?.customer?.full_name || 
                               assignment.booking?.customer?.full_name || 
                               'N/A';
            const basketNo = assignment.basket?.basket_no || 'N/A';
            const equipmentName = assignment.equipment_source === 'Center' 
                ? `${assignment.equipment_item?.equipment?.name || 'Equipment'}${assignment.equipment_item?.size ? ` - ${assignment.equipment_item.size}` : ''}`
                : `${assignment.customer_equipment_type || 'Equipment'}${assignment.customer_equipment_brand ? ` - ${assignment.customer_equipment_brand}` : ''}`;
            const serialNo = assignment.equipment_source === 'Center'
                ? (assignment.equipment_item?.serial_no || 'N/A')
                : (assignment.customer_equipment_serial || 'N/A');
            const inventoryCode = assignment.equipment_source === 'Center'
                ? (assignment.equipment_item?.inventory_code || 'N/A')
                : 'N/A';

            return [
                customerName,
                basketNo,
                equipmentName,
                serialNo,
                inventoryCode,
                assignment.equipment_source,
                assignment.checkout_date ? safeFormatDate(assignment.checkout_date, "MMM d, yyyy", "N/A") : "N/A",
                assignment.return_date ? safeFormatDate(assignment.return_date, "MMM d, yyyy", "N/A") : "N/A",
                assignment.assignment_status
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `equipment-assignments-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Equipment Assignments" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Total Assignments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{filteredAssignments.length}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-green-600">{activeAssignments.length}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground">Returned</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-gray-600">{returnedAssignments.length}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Actions */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Equipment Assignments</CardTitle>
                                <CardDescription>
                                    View all equipment assignments with item codes
                                </CardDescription>
                            </div>
                            <Button onClick={handleExportCSV} variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by customer, item code, serial number..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Checked Out">Checked Out</SelectItem>
                                    <SelectItem value="Returned">Returned</SelectItem>
                                    <SelectItem value="Lost">Lost</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={sourceFilter} onValueChange={setSourceFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by source" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sources</SelectItem>
                                    <SelectItem value="Center">Center</SelectItem>
                                    <SelectItem value="Customer Own">Customer Own</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">Loading assignments...</p>
                            </div>
                        ) : filteredAssignments.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No assignments found</p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Basket</TableHead>
                                            <TableHead>Equipment</TableHead>
                                            <TableHead>Serial Number</TableHead>
                                            <TableHead>Inventory Code</TableHead>
                                            <TableHead>Source</TableHead>
                                            <TableHead>Checkout Date</TableHead>
                                            <TableHead>Return Date</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAssignments.map((assignment) => {
                                            const customerName = assignment.basket?.customer?.full_name || 
                                                               assignment.booking?.customer?.full_name || 
                                                               'N/A';
                                            const basketNo = assignment.basket?.basket_no;
                                            const equipmentName = assignment.equipment_source === 'Center' 
                                                ? `${assignment.equipment_item?.equipment?.name || 'Equipment'}${assignment.equipment_item?.size ? ` - ${assignment.equipment_item.size}` : ''}`
                                                : `${assignment.customer_equipment_type || 'Equipment'}${assignment.customer_equipment_brand ? ` - ${assignment.customer_equipment_brand}` : ''}`;
                                            const serialNo = assignment.equipment_source === 'Center'
                                                ? assignment.equipment_item?.serial_no
                                                : assignment.customer_equipment_serial;
                                            const inventoryCode = assignment.equipment_source === 'Center'
                                                ? assignment.equipment_item?.inventory_code
                                                : undefined;

                                            return (
                                                <TableRow key={assignment.id}>
                                                    <TableCell className="font-medium">
                                                        {customerName}
                                                    </TableCell>
                                                    <TableCell>
                                                        {basketNo ? (
                                                            <Link 
                                                                href={`/dashboard/baskets/${assignment.basket_id}`}
                                                                className="text-blue-600 hover:underline font-mono text-sm"
                                                            >
                                                                {basketNo}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-muted-foreground">N/A</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{equipmentName}</TableCell>
                                                    <TableCell>
                                                        {serialNo ? (
                                                            <Badge variant="outline" className="font-mono">
                                                                {serialNo}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground">N/A</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {inventoryCode ? (
                                                            <Badge variant="outline" className="font-mono">
                                                                {inventoryCode}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground">N/A</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={assignment.equipment_source === 'Center' ? 'default' : 'secondary'}>
                                                            {assignment.equipment_source}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {assignment.checkout_date 
                                                            ? safeFormatDate(assignment.checkout_date, "MMM d, yyyy", "N/A")
                                                            : "N/A"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {assignment.return_date 
                                                            ? safeFormatDate(assignment.return_date, "MMM d, yyyy", "N/A")
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

