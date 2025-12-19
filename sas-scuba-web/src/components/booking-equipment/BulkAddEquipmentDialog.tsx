"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { bookingEquipmentService, BookingEquipmentFormData } from "@/lib/api/services/booking-equipment.service";
import { equipmentItemService, EquipmentItem } from "@/lib/api/services/equipment-item.service";
import { Package, Plus, X, ShoppingBasket } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BulkAddEquipmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    basketId: number;
    onSuccess: () => void;
}

interface EquipmentItemToAdd {
    id: string; // temporary ID for list
    equipment_source: 'Center' | 'Customer Own';
    equipment_item_id?: number;
    customer_equipment_type?: string;
    customer_equipment_brand?: string;
    customer_equipment_model?: string;
    customer_equipment_serial?: string;
    customer_equipment_notes?: string;
    price?: number;
}

export function BulkAddEquipmentDialog({ open, onOpenChange, basketId, onSuccess }: BulkAddEquipmentDialogProps) {
    const [loading, setLoading] = useState(false);
    const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
    const [itemsToAdd, setItemsToAdd] = useState<EquipmentItemToAdd[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Load equipment items when dialog opens
    useEffect(() => {
        if (open) {
            loadEquipmentItems();
            // Reset form when opening
            setItemsToAdd([]);
            setError(null);
        }
    }, [open]);

    const loadEquipmentItems = async () => {
        try {
            const data = await equipmentItemService.getAll(1, undefined, 'Available');
            const itemsList = Array.isArray(data) ? data : (data as any).data || [];
            setEquipmentItems(itemsList);
        } catch (error) {
            console.error("Failed to fetch equipment items", error);
        }
    };

    const addCenterEquipmentItem = () => {
        const newItem: EquipmentItemToAdd = {
            id: `center-${Date.now()}`,
            equipment_source: 'Center',
            equipment_item_id: undefined,
            price: 0,
        };
        setItemsToAdd([...itemsToAdd, newItem]);
    };

    const addCustomerEquipmentItem = () => {
        const newItem: EquipmentItemToAdd = {
            id: `customer-${Date.now()}`,
            equipment_source: 'Customer Own',
            customer_equipment_brand: '',
            price: 0,
        };
        setItemsToAdd([...itemsToAdd, newItem]);
    };

    const removeItem = (id: string) => {
        setItemsToAdd(itemsToAdd.filter(item => item.id !== id));
    };

    const updateItem = (id: string, updates: Partial<EquipmentItemToAdd>) => {
        setItemsToAdd(itemsToAdd.map(item => 
            item.id === id ? { ...item, ...updates } : item
        ));
    };

    const handleSubmit = async () => {
        setError(null);
        
        // Validate
        if (itemsToAdd.length === 0) {
            setError("Please add at least one equipment item");
            return;
        }

        // Validate each item
        for (const item of itemsToAdd) {
            if (item.equipment_source === 'Center' && !item.equipment_item_id) {
                setError("Please select equipment item for all center equipment");
                return;
            }
            if (item.equipment_source === 'Customer Own' && !item.customer_equipment_brand) {
                setError("Please enter brand for all customer equipment");
                return;
            }
        }

        setLoading(true);
        try {
            // Use today's date as checkout date
            const checkoutDate = new Date();
            
            // Create all items
            const promises = itemsToAdd.map(item => {
                const payload: BookingEquipmentFormData = {
                    basket_id: basketId,
                    equipment_source: item.equipment_source,
                    equipment_item_id: item.equipment_item_id,
                    checkout_date: formatDateToString(checkoutDate),
                    price: item.price || 0,
                    customer_equipment_type: item.customer_equipment_type,
                    customer_equipment_brand: item.customer_equipment_brand,
                    customer_equipment_model: item.customer_equipment_model,
                    customer_equipment_serial: item.customer_equipment_serial,
                    customer_equipment_notes: item.customer_equipment_notes,
                };
                return bookingEquipmentService.create(payload);
            });

            await Promise.all(promises);
            
            // Reset form
            setItemsToAdd([]);
            setError(null);
            
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Failed to add equipment", error);
            
            // Check if this is an availability error with conflicts
            if (error?.response?.status === 422 && error?.response?.data?.conflicting_assignments) {
                const conflicts = error.response.data.conflicting_assignments;
                let conflictMessage = error.response.data.message || "Equipment is not available for the requested dates.\n\n";
                conflictMessage += `Requested dates: ${error.response.data.checkout_date} to ${error.response.data.return_date}\n\n`;
                conflictMessage += "Conflicting assignments:\n";
                conflicts.forEach((conflict: any, index: number) => {
                    conflictMessage += `\n${index + 1}. Customer: ${conflict.customer_name}`;
                    if (conflict.basket_no) {
                        conflictMessage += ` (Basket: ${conflict.basket_no})`;
                    }
                    conflictMessage += `\n   Dates: ${conflict.checkout_date} to ${conflict.return_date}`;
                    conflictMessage += `\n   Status: ${conflict.assignment_status}`;
                });
                setError(conflictMessage);
            } else {
                setError(error.response?.data?.message || "Failed to add equipment. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDateToString = (date: Date | null): string => {
        if (!date) return "";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingBasket className="h-5 w-5" />
                        Bulk Add Equipment to Basket
                    </DialogTitle>
                    <DialogDescription>
                        Add multiple equipment items to this basket at once. You can mix center equipment and customer-owned equipment.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Add Buttons */}
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={addCenterEquipmentItem}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Center Equipment
                        </Button>
                        <Button type="button" variant="outline" onClick={addCustomerEquipmentItem}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Customer Equipment
                        </Button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Items List */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {itemsToAdd.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Click "Add Center Equipment" or "Add Customer Equipment" to start adding items
                            </div>
                        ) : (
                            itemsToAdd.map((item, index) => (
                                <div key={item.id} className="p-4 border rounded-lg space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">
                                            Item {index + 1} - {item.equipment_source === 'Center' ? 'Center Equipment' : 'Customer Own'}
                                        </h4>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeItem(item.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {item.equipment_source === 'Center' ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Equipment Item *</Label>
                                                <Select
                                                    value={item.equipment_item_id ? String(item.equipment_item_id) : ""}
                                                    onValueChange={(value) => updateItem(item.id, { equipment_item_id: parseInt(value) })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select equipment" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {equipmentItems.map((eqItem) => (
                                                            <SelectItem key={eqItem.id} value={String(eqItem.id)}>
                                                                {eqItem.equipment?.name || 'Equipment'} - {eqItem.size || 'N/A'} ({eqItem.status})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Price</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={item.price || 0}
                                                    onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Equipment Type</Label>
                                                <Select
                                                    value={item.customer_equipment_type || ""}
                                                    onValueChange={(value) => updateItem(item.id, { customer_equipment_type: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type (optional)" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="BCD">BCD</SelectItem>
                                                        <SelectItem value="Regulator">Regulator</SelectItem>
                                                        <SelectItem value="Wetsuit">Wetsuit</SelectItem>
                                                        <SelectItem value="Dry Suit">Dry Suit</SelectItem>
                                                        <SelectItem value="Mask">Mask</SelectItem>
                                                        <SelectItem value="Fins">Fins</SelectItem>
                                                        <SelectItem value="Snorkel">Snorkel</SelectItem>
                                                        <SelectItem value="Dive Computer">Dive Computer</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Custom Type</Label>
                                                <Input
                                                    value={item.customer_equipment_type && !["BCD", "Regulator", "Wetsuit", "Dry Suit", "Mask", "Fins", "Snorkel", "Dive Computer"].includes(item.customer_equipment_type) ? item.customer_equipment_type : ""}
                                                    onChange={(e) => updateItem(item.id, { customer_equipment_type: e.target.value })}
                                                    placeholder="Type custom name"
                                                />
                                            </div>
                                            <div>
                                                <Label>Brand *</Label>
                                                <Input
                                                    value={item.customer_equipment_brand || ""}
                                                    onChange={(e) => updateItem(item.id, { customer_equipment_brand: e.target.value })}
                                                    placeholder="e.g., Scubapro"
                                                />
                                            </div>
                                            <div>
                                                <Label>Model</Label>
                                                <Input
                                                    value={item.customer_equipment_model || ""}
                                                    onChange={(e) => updateItem(item.id, { customer_equipment_model: e.target.value })}
                                                    placeholder="e.g., MK25"
                                                />
                                            </div>
                                            <div>
                                                <Label>Serial Number</Label>
                                                <Input
                                                    value={item.customer_equipment_serial || ""}
                                                    onChange={(e) => updateItem(item.id, { customer_equipment_serial: e.target.value })}
                                                    placeholder="Serial number"
                                                />
                                            </div>
                                            <div>
                                                <Label>Price</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={item.price || 0}
                                                    onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || itemsToAdd.length === 0}>
                        {loading ? "Adding..." : `Add ${itemsToAdd.length} Item${itemsToAdd.length !== 1 ? 's' : ''}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

