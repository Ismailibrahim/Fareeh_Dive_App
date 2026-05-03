"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Loader2, Save, ChevronDown, Anchor } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import { customerService, EquipmentRequestData, EquipmentRequestItem } from "@/lib/api/services/customer.service";
import { equipmentTypeService, EquipmentType } from "@/lib/api/services/equipment-type.service";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CustomerEquipmentCardProps {
    customerId: number;
}

export function CustomerEquipmentCard({ customerId }: CustomerEquipmentCardProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
    
    // Form state
    const [expectedReturnDate, setExpectedReturnDate] = useState<string | undefined>(undefined);
    const [generalNotes, setGeneralNotes] = useState("");
    const [items, setItems] = useState<Record<string, { rent: boolean; own: boolean; note: string }>>({});

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch settings types
                const types = await equipmentTypeService.getAll(true);
                setEquipmentTypes(types);

                // Fetch existing request for this customer
                const response = await customerService.getEquipmentRequest(customerId);
                const basket = response?.data;
                
                // Initialize state from database
                const initialItems: Record<string, { rent: boolean; own: boolean; note: string }> = {};
                
                if (basket) {
                    if (basket.expected_return_date) {
                        setExpectedReturnDate(basket.expected_return_date);
                    }
                    if (basket.notes) {
                        setGeneralNotes(basket.notes);
                    }
                    
                    if (basket.booking_equipment) {
                        basket.booking_equipment.forEach((eq: any) => {
                            if (eq.customer_equipment_type) {
                                initialItems[eq.customer_equipment_type] = {
                                    rent: eq.equipment_source === 'Center',
                                    own: eq.equipment_source === 'Customer Own',
                                    note: eq.customer_equipment_notes || "",
                                };
                            }
                        });
                    }
                }
                
                // Ensure all active types have an entry in the local state, even if unselected
                types.forEach(t => {
                    if (!initialItems[t.name]) {
                        initialItems[t.name] = { rent: false, own: false, note: "" };
                    }
                });

                setItems(initialItems);
            } catch (error) {
                console.error("Failed to load equipment data", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [customerId]);

    const handleCheckboxChange = (typeName: string, field: 'rent' | 'own', checked: boolean) => {
        setItems(prev => ({
            ...prev,
            [typeName]: {
                ...prev[typeName],
                [field]: checked,
                // Optional logic: if they click rent, uncheck own, etc. The user asked "Does checking 'Rent' and 'Own' at the same time make sense...?"
                // To be safe, let's treat them as independent checkboxes unless specified.
            }
        }));
    };

    const handleNoteChange = (typeName: string, value: string) => {
        setItems(prev => ({
            ...prev,
            [typeName]: {
                ...prev[typeName],
                note: value
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Prepare payload
            const payloadItems: EquipmentRequestItem[] = [];
            
            Object.keys(items).forEach(typeName => {
                const item = items[typeName];
                if (item.rent || item.own) {
                    payloadItems.push({
                        equipment_type_name: typeName,
                        rent: item.rent,
                        own: item.own,
                        note: item.note,
                    });
                }
            });

            const payload: EquipmentRequestData = {
                expected_return_date: expectedReturnDate || null,
                notes: generalNotes,
                items: payloadItems,
            };

            await customerService.updateEquipmentRequest(customerId, payload);
            alert("Equipment request saved successfully!");
        } catch (error) {
            console.error("Failed to save equipment request", error);
            alert("Failed to save equipment request. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Calculate requested count
    const requestedCount = Object.values(items).filter(item => item.rent || item.own).length;

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Customer Equipment Request</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Anchor className="h-5 w-5 text-primary" />
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-xl">Customer Equipment Request</CardTitle>
                                    {requestedCount > 0 && (
                                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-2 py-0.5 text-xs font-bold rounded-full">
                                            {requestedCount}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div>
                                <CardDescription>
                                    Track rental or personal equipment for dives
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                {!isEditing ? (
                                    <Button 
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isOpen) setIsOpen(true);
                                            setIsEditing(true);
                                        }}
                                        className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                                    >
                                        <Save className="h-4 w-4" />
                                        Edit
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsEditing(false);
                                            }}
                                            className="h-8"
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSave().then(() => setIsEditing(false));
                                            }} 
                                            disabled={saving} 
                                            size="sm"
                                            className="h-8"
                                        >
                                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            <Save className="mr-2 h-4 w-4" />
                                            Save
                                        </Button>
                                    </div>
                                )}
                                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                            </div>
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent>
                        {isEditing ? (
                            // Edit Mode: Interactive Table
                            equipmentTypes.length === 0 ? (
                                <div className="text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-dashed">
                                    No equipment types found. Please add items in <strong>Settings → Dropdown Options → Equipment Item List</strong> first.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="rounded-md border overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                                                    <TableHead className="w-[30%]">Equipment Name</TableHead>
                                                    <TableHead className="w-[15%] text-center">Rent</TableHead>
                                                    <TableHead className="w-[15%] text-center">Own</TableHead>
                                                    <TableHead className="w-[40%]">Note</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {equipmentTypes.map((type) => {
                                                    const itemState = items[type.name] || { rent: false, own: false, note: "" };
                                                    return (
                                                        <TableRow key={type.id}>
                                                            <TableCell className="font-medium">{type.name}</TableCell>
                                                            <TableCell className="text-center">
                                                                <Checkbox 
                                                                    checked={itemState.rent}
                                                                    onCheckedChange={(c) => handleCheckboxChange(type.name, 'rent', !!c)}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Checkbox 
                                                                    checked={itemState.own}
                                                                    onCheckedChange={(c) => handleCheckboxChange(type.name, 'own', !!c)}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input 
                                                                    placeholder="Add note..." 
                                                                    value={itemState.note}
                                                                    onChange={(e) => handleNoteChange(type.name, e.target.value)}
                                                                    className="h-8"
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 pt-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Equipment Return Date (for all items)</label>
                                            <DatePicker
                                                value={expectedReturnDate}
                                                onChange={setExpectedReturnDate}
                                                placeholder="Pick a date"
                                                className="w-full sm:w-[240px]"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">General Notes</label>
                                            <Textarea 
                                                placeholder="Add any general notes about this equipment request here..." 
                                                value={generalNotes}
                                                onChange={(e) => setGeneralNotes(e.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={() => handleSave().then(() => setIsEditing(false))} disabled={saving} size="lg">
                                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Equipment Request
                                        </Button>
                                    </div>
                                </div>
                            )
                        ) : (
                            // View Mode: Summary List
                            <div className="space-y-6">
                                {requestedCount === 0 ? (
                                    <div className="text-center py-8 space-y-4">
                                        <Anchor className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                                        <div>
                                            <p className="text-sm font-medium">No equipment requested yet</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Add equipment rental or personal items for this customer
                                            </p>
                                        </div>
                                        <Button size="sm" onClick={() => setIsEditing(true)}>
                                            <Save className="h-4 w-4 mr-2" />
                                            Add Equipment Request
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {Object.entries(items).filter(([_, val]) => val.rent || val.own).map(([name, val]) => (
                                                <div key={name} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="bg-primary/10 p-2 rounded-md">
                                                            <Anchor className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold truncate">{name}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                {val.rent && <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-blue-200 bg-blue-50 text-blue-700">Center Rental</Badge>}
                                                                {val.own && <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-green-200 bg-green-50 text-green-700">Customer Own</Badge>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {val.note && (
                                                        <div className="text-xs text-muted-foreground italic truncate max-w-[40%] ml-2 border-l pl-2">
                                                            "{val.note}"
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {(expectedReturnDate || generalNotes) && (
                                            <div className="pt-4 border-t space-y-4">
                                                {expectedReturnDate && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">Return Date:</span>
                                                        <span className="text-muted-foreground">{format(new Date(expectedReturnDate), "PPP")}</span>
                                                    </div>
                                                )}
                                                {generalNotes && (
                                                    <div className="bg-muted/30 p-3 rounded-md border border-dashed">
                                                        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">General Notes</p>
                                                        <p className="text-sm text-muted-foreground">{generalNotes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="pt-2">
                                            <Button variant="outline" className="w-full" onClick={() => setIsEditing(true)}>
                                                <Save className="h-4 w-4 mr-2" />
                                                Edit Equipment Request
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
