"use client";

import { useEffect, useState } from "react";
import { equipmentServiceHistoryService, EquipmentServiceHistory } from "@/lib/api/services/equipment-service-history.service";
import { EquipmentItem, equipmentItemService } from "@/lib/api/services/equipment-item.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Wrench, Calendar, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ServiceHistoryForm } from "./ServiceHistoryForm";
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

interface ServiceHistorySectionProps {
    equipmentItemId: string | number;
    equipmentItem?: EquipmentItem;
    onEquipmentItemUpdate?: (updatedItem: EquipmentItem) => void;
}

export function ServiceHistorySection({ equipmentItemId, equipmentItem, onEquipmentItemUpdate }: ServiceHistorySectionProps) {
    const [serviceHistory, setServiceHistory] = useState<EquipmentServiceHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState<EquipmentServiceHistory | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<EquipmentServiceHistory | null>(null);

    const fetchServiceHistory = async () => {
        setLoading(true);
        try {
            const data = await equipmentServiceHistoryService.getAll(equipmentItemId);
            const list = Array.isArray(data) ? data : (data as any).data || [];
            setServiceHistory(list);
        } catch (error) {
            console.error("Failed to fetch service history", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServiceHistory();
    }, [equipmentItemId]);

    const handleAddClick = () => {
        setEditingRecord(null);
        setShowForm(true);
    };

    const handleEditClick = (record: EquipmentServiceHistory) => {
        setEditingRecord(record);
        setShowForm(true);
    };

    const handleDeleteClick = (record: EquipmentServiceHistory) => {
        setRecordToDelete(record);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!recordToDelete) return;
        try {
            await equipmentServiceHistoryService.delete(equipmentItemId, recordToDelete.id);
            await fetchServiceHistory();
            
            // Refresh equipment item data to get updated next_service_date
            if (onEquipmentItemUpdate) {
                try {
                    const updatedItem = await equipmentItemService.getById(equipmentItemId);
                    onEquipmentItemUpdate(updatedItem);
                } catch (error) {
                    console.error("Failed to refresh equipment item", error);
                }
            }
        } catch (error) {
            console.error("Failed to delete service record", error);
        } finally {
            setDeleteDialogOpen(false);
            setRecordToDelete(null);
        }
    };

    const handleFormSuccess = async () => {
        setShowForm(false);
        setEditingRecord(null);
        await fetchServiceHistory();
        
        // Refresh equipment item data to get updated next_service_date
        if (onEquipmentItemUpdate) {
            try {
                const updatedItem = await equipmentItemService.getById(equipmentItemId);
                onEquipmentItemUpdate(updatedItem);
            } catch (error) {
                console.error("Failed to refresh equipment item", error);
            }
        }
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setEditingRecord(null);
    };

    if (showForm) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Service History</CardTitle>
                </CardHeader>
                <CardContent>
                    <ServiceHistoryForm
                        equipmentItemId={equipmentItemId}
                        equipmentItem={equipmentItem}
                        initialData={editingRecord || undefined}
                        serviceHistoryId={editingRecord?.id}
                        onSuccess={handleFormSuccess}
                        onCancel={handleFormCancel}
                    />
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Wrench className="h-5 w-5 text-primary" />
                                Service History
                            </CardTitle>
                            <CardDescription>
                                Complete record of all services performed on this equipment item.
                            </CardDescription>
                        </div>
                        <Button onClick={handleAddClick}>
                            <Plus className="mr-2 h-4 w-4" /> Add Service Record
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </div>
                    ) : serviceHistory.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">
                            No service records found. Click "Add Service Record" to create one.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Service Date</TableHead>
                                        <TableHead>Service Type</TableHead>
                                        <TableHead>Technician</TableHead>
                                        <TableHead>Cost</TableHead>
                                        <TableHead>Next Service Due</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {serviceHistory.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell>
                                                {record.service_date ? format(new Date(record.service_date), "MMM d, yyyy") : "-"}
                                            </TableCell>
                                            <TableCell>
                                                {record.service_type || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {record.technician || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {record.cost ? `$${Number(record.cost).toFixed(2)}` : "-"}
                                            </TableCell>
                                            <TableCell>
                                                {record.next_service_due_date ? (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {format(new Date(record.next_service_due_date), "MMM d, yyyy")}
                                                    </div>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditClick(record)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(record)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this service record
                            {recordToDelete?.service_date && (
                                <> from <strong>{format(new Date(recordToDelete.service_date), "MMM d, yyyy")}</strong></>
                            )}
                            .
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
        </>
    );
}

