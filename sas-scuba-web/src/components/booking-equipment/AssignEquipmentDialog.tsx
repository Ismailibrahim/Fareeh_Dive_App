"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { BookingEquipment, bookingEquipmentService } from "@/lib/api/services/booking-equipment.service";
import { equipmentItemService, EquipmentItem } from "@/lib/api/services/equipment-item.service";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AssignEquipmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    equipment: BookingEquipment | null;
    onSuccess: () => void;
}

export function AssignEquipmentDialog({ open, onOpenChange, equipment, onSuccess }: AssignEquipmentDialogProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [availableItems, setAvailableItems] = useState<EquipmentItem[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

    // Initial search term based on equipment type
    useEffect(() => {
        if (open && equipment?.customer_equipment_type) {
            setSearchTerm(equipment.customer_equipment_type);
            setSelectedItemId(null);
        }
    }, [open, equipment]);

    // Fetch items when search term changes (debounced)
    useEffect(() => {
        if (!open) return;

        const timer = setTimeout(() => {
            fetchItems();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, open]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const response = await equipmentItemService.getAll({ 
                search: searchTerm, 
                per_page: 50,
                // We show all items, or we can filter by Available
                // status: 'Available'
            });
            setAvailableItems(response.data);
        } catch (error) {
            console.error("Failed to fetch equipment items", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!equipment || !selectedItemId) return;
        
        setSaving(true);
        try {
            await bookingEquipmentService.update(equipment.id, {
                equipment_item_id: selectedItemId,
                assignment_status: 'Checked Out',
            });
            
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Failed to assign equipment", error);
            const msg = error.response?.data?.message || "Failed to assign equipment. It might not be available.";
            alert(msg);
        } finally {
            setSaving(false);
        }
    };

    if (!equipment) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Tag Inventory Item</DialogTitle>
                    <DialogDescription>
                        Select a physical inventory item for the requested {equipment.customer_equipment_type}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Search Inventory</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, brand, serial no..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Available Items</Label>
                        <div className="border rounded-md max-h-[250px] overflow-y-auto p-1">
                            {loading ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : availableItems.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No items found.
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {availableItems.map((item) => (
                                        <div 
                                            key={item.id}
                                            onClick={() => setSelectedItemId(item.id)}
                                            className={`p-2 rounded-md cursor-pointer flex justify-between items-center text-sm ${selectedItemId === item.id ? 'bg-primary/10 border-primary border' : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'}`}
                                        >
                                            <div>
                                                <div className="font-medium">
                                                    {item.equipment?.name} {item.brand && `- ${item.brand}`}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                                                    {item.serial_no && <span>SN: {item.serial_no}</span>}
                                                    {item.inventory_code && <span>Code: {item.inventory_code}</span>}
                                                    {item.size && <span>Size: {item.size}</span>}
                                                </div>
                                            </div>
                                            <div className="text-xs">
                                                <span className={`px-2 py-1 rounded-full ${item.status === 'Available' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleAssign} disabled={!selectedItemId || saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Assign & Check Out
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
