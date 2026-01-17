"use client";

import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { equipmentItemService, EquipmentItem } from "@/lib/api/services/equipment-item.service";
import { bookingEquipmentService } from "@/lib/api/services/booking-equipment.service";
import { Package, Check, X, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface EquipmentTemplatesProps {
    basketId: number;
    checkoutDate: string;
    returnDate?: string;
    bookingId?: number;
    onSuccess: () => void;
}

interface TemplateDefinition {
    id: string;
    name: string;
    description: string;
    equipmentTypes: Array<{
        equipment_id: number;
        equipment_name: string;
    }>;
}

// Predefined templates - these should match equipment IDs in the database
const TEMPLATES: TemplateDefinition[] = [
    {
        id: "full-set",
        name: "Full Set",
        description: "Complete diving equipment set",
        equipmentTypes: [
            { equipment_id: 1, equipment_name: "BCD" }, // These IDs need to match your database
            { equipment_id: 2, equipment_name: "Regulator" },
            { equipment_id: 3, equipment_name: "Wetsuit" },
            { equipment_id: 4, equipment_name: "Mask" },
            { equipment_id: 5, equipment_name: "Fins" },
            { equipment_id: 6, equipment_name: "Snorkel" },
        ],
    },
    {
        id: "bcd-regulator",
        name: "BCD + Regulator",
        description: "BCD and Regulator combo",
        equipmentTypes: [
            { equipment_id: 1, equipment_name: "BCD" },
            { equipment_id: 2, equipment_name: "Regulator" },
        ],
    },
    {
        id: "wetsuit-only",
        name: "Wetsuit Only",
        description: "Just a wetsuit",
        equipmentTypes: [
            { equipment_id: 3, equipment_name: "Wetsuit" },
        ],
    },
];

interface AvailabilityResult {
    equipment_id: number;
    equipment_name: string;
    available_items: EquipmentItem[];
    available_count: number;
    total_items: number;
}

interface SelectedItem {
    equipment_id: number;
    equipment_name: string;
    equipment_item_id: number;
    price: number;
}

export function EquipmentTemplates({
    basketId,
    checkoutDate,
    returnDate,
    bookingId,
    onSuccess,
}: EquipmentTemplatesProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null);
    const [loading, setLoading] = useState(false);
    const [availabilityResults, setAvailabilityResults] = useState<AvailabilityResult[]>([]);
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [addingItems, setAddingItems] = useState(false);

    const handleTemplateClick = async (template: TemplateDefinition) => {
        setSelectedTemplate(template);
        setLoading(true);
        setError(null);
        setDialogOpen(true);
        setSelectedItems([]);

        try {
            const returnDateToUse = returnDate || new Date(new Date(checkoutDate).setDate(new Date(checkoutDate).getDate() + 1)).toISOString().split('T')[0];
            
            const result = await equipmentItemService.findAvailableByEquipmentType({
                equipment_ids: template.equipmentTypes.map(t => t.equipment_id),
                checkout_date: checkoutDate,
                return_date: returnDateToUse,
            });

            setAvailabilityResults(result.results);
            
            // Auto-select first available item for each type
            const autoSelected: SelectedItem[] = [];
            result.results.forEach((result) => {
                if (result.available_count > 0) {
                    const firstItem = result.available_items[0];
                    autoSelected.push({
                        equipment_id: result.equipment_id,
                        equipment_name: result.equipment_name,
                        equipment_item_id: firstItem.id,
                        price: 0,
                    });
                }
            });
            setSelectedItems(autoSelected);
        } catch (err: any) {
            console.error("Failed to check availability", err);
            setError(err?.response?.data?.message || "Failed to check equipment availability");
        } finally {
            setLoading(false);
        }
    };

    const handleItemSelection = (equipmentId: number, equipmentItemId: number) => {
        setSelectedItems(prev => {
            const existing = prev.find(item => item.equipment_id === equipmentId);
            if (existing) {
                return prev.map(item => 
                    item.equipment_id === equipmentId 
                        ? { ...item, equipment_item_id: equipmentItemId }
                        : item
                );
            } else {
                const result = availabilityResults.find(r => r.equipment_id === equipmentId);
                return [...prev, {
                    equipment_id: equipmentId,
                    equipment_name: result?.equipment_name || 'Unknown',
                    equipment_item_id: equipmentItemId,
                    price: 0,
                }];
            }
        });
    };

    const handlePriceChange = (equipmentId: number, price: number) => {
        setSelectedItems(prev =>
            prev.map(item =>
                item.equipment_id === equipmentId
                    ? { ...item, price }
                    : item
            )
        );
    };

    const handleAddItems = async () => {
        if (selectedItems.length === 0) {
            setError("Please select at least one equipment item");
            return;
        }

        setAddingItems(true);
        setError(null);

        try {
            const items = selectedItems.map(item => ({
                basket_id: basketId,
                booking_id: bookingId,
                equipment_item_id: item.equipment_item_id,
                equipment_source: 'Center' as const,
                checkout_date: checkoutDate,
                return_date: returnDate || new Date(new Date(checkoutDate).setDate(new Date(checkoutDate).getDate() + 1)).toISOString().split('T')[0],
                price: item.price || 0,
            }));

            const result = await bookingEquipmentService.bulkCreate({ items });

            if (result.failed_count > 0) {
                let errorMsg = `Added ${result.success_count} items, but ${result.failed_count} failed:\n\n`;
                result.failed.forEach((failed, index) => {
                    errorMsg += `Item ${failed.index + 1}: ${failed.error}\n`;
                });
                setError(errorMsg);
            } else {
                setDialogOpen(false);
                setSelectedTemplate(null);
                setSelectedItems([]);
                setAvailabilityResults([]);
                onSuccess();
            }
        } catch (err: any) {
            console.error("Failed to add items", err);
            setError(err?.response?.data?.message || "Failed to add equipment items");
        } finally {
            setAddingItems(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <Label className="text-sm font-medium mb-2 block">Quick Templates</Label>
                <div className="flex flex-wrap gap-2">
                    {TEMPLATES.map((template) => (
                        <Button
                            key={template.id}
                            type="button"
                            variant="outline"
                            onClick={() => handleTemplateClick(template)}
                            className="flex items-center gap-2"
                        >
                            <Package className="h-4 w-4" />
                            {template.name}
                        </Button>
                    ))}
                </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="!max-w-none !w-[75vw] !h-[75vh] !max-h-[75vh] overflow-y-auto bg-card text-card-foreground !rounded-xl !border shadow-lg p-6 gap-6 !fixed !m-0 !translate-x-[-50%] !translate-y-[-50%] !top-1/2 !left-1/2 !right-auto !bottom-auto z-[100] data-[state=open]:!translate-x-[-50%] data-[state=open]:!translate-y-[-50%]">
                    <DialogHeader className="pb-2">
                        <DialogTitle className="flex items-center gap-3 text-lg leading-none font-semibold">
                            <Package className="h-5 w-5" />
                            {selectedTemplate?.name}
                        </DialogTitle>
                        {selectedTemplate?.description && (
                            <DialogDescription className="text-sm text-muted-foreground pt-1">
                                {selectedTemplate.description}
                            </DialogDescription>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                            Items are pre-selected, but you can change any item using the dropdown before adding to basket.
                        </p>
                    </DialogHeader>

                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            <span className="ml-3 text-sm text-muted-foreground">Checking availability...</span>
                        </div>
                    )}

                    {error && (
                        <Alert variant="destructive" className="py-3 mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="whitespace-pre-line text-sm">{error}</AlertDescription>
                        </Alert>
                    )}

                    {!loading && availabilityResults.length > 0 && (
                        <div className="space-y-4">
                            {availabilityResults.map((result) => {
                                const selectedItem = selectedItems.find(item => item.equipment_id === result.equipment_id);
                                const isAvailable = result.available_count > 0;
                                const selectedItemData = selectedItem ? result.available_items.find(item => item.id === selectedItem.equipment_item_id) : null;

                                return (
                                    <div key={result.equipment_id} className="border rounded-lg border-border bg-card">
                                        <div className="p-4 border-b bg-muted/30">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    {isAvailable ? (
                                                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                    ) : (
                                                        <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                                                    )}
                                                    <div>
                                                        <Label className="text-base font-semibold">
                                                            {result.equipment_name}
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {isAvailable 
                                                                ? `${result.available_count} available out of ${result.total_items} items`
                                                                : 'No items available for selected dates'
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant={isAvailable ? "default" : "destructive"} className="text-sm px-3 py-1">
                                                    {result.available_count}/{result.total_items}
                                                </Badge>
                                            </div>
                                        </div>

                                        {isAvailable && (
                                            <div className="p-4 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-[1fr_150px] gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-medium">Select Item</Label>
                                                        <Select
                                                            key={`select-${result.equipment_id}-${selectedItem?.equipment_item_id || 'none'}`}
                                                            value={selectedItem?.equipment_item_id ? String(selectedItem.equipment_item_id) : ""}
                                                            onValueChange={(value) => {
                                                                const itemId = parseInt(value, 10);
                                                                if (!isNaN(itemId) && itemId > 0) {
                                                                    handleItemSelection(result.equipment_id, itemId);
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger className="h-10 w-full">
                                                                <SelectValue placeholder="Choose an item..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="z-[200]">
                                                                {result.available_items.map((item) => (
                                                                    <SelectItem key={item.id} value={String(item.id)}>
                                                                        {item.equipment?.name || 'Equipment'}
                                                                        {item.size && ` - ${item.size}`}
                                                                        {item.brand && ` (${item.brand})`}
                                                                        {item.serial_no && ` | SN: ${item.serial_no}`}
                                                                        {item.inventory_code && ` | Code: ${item.inventory_code}`}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-medium">Price</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={selectedItem?.price || 0}
                                                            onChange={(e) => handlePriceChange(result.equipment_id, parseFloat(e.target.value) || 0)}
                                                            placeholder="0.00"
                                                            className="h-10"
                                                            disabled={!selectedItem}
                                                        />
                                                    </div>
                                                </div>

                                                {selectedItemData && (
                                                    <div className="p-3 bg-muted/50 rounded-md border">
                                                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Selected Item Details</Label>
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            {selectedItemData.serial_no && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-muted-foreground">Serial:</span>
                                                                    <Badge variant="outline" className="font-mono text-xs">
                                                                        {selectedItemData.serial_no}
                                                                    </Badge>
                                                                </div>
                                                            )}
                                                            {selectedItemData.inventory_code && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-muted-foreground">Code:</span>
                                                                    <Badge variant="outline" className="font-mono text-xs">
                                                                        {selectedItemData.inventory_code}
                                                                    </Badge>
                                                                </div>
                                                            )}
                                                            {selectedItemData.size && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-muted-foreground">Size:</span>
                                                                    <span className="text-xs font-medium">{selectedItemData.size}</span>
                                                                </div>
                                                            )}
                                                            {selectedItemData.brand && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-muted-foreground">Brand:</span>
                                                                    <span className="text-xs font-medium">{selectedItemData.brand}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {!isAvailable && (
                                            <div className="p-4">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <X className="h-4 w-4" />
                                                    <span>No items available for the selected date range</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <DialogFooter className="pt-4 mt-4 border-t">
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={addingItems} size="default" className="h-10">
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleAddItems} 
                            disabled={addingItems || selectedItems.length === 0}
                            size="default"
                            className="h-10"
                        >
                            {addingItems ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                `Add ${selectedItems.length} Item${selectedItems.length !== 1 ? 's' : ''}`
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

