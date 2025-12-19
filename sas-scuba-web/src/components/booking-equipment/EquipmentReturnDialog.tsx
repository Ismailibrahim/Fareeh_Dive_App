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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { BookingEquipment, DamageInfo, bookingEquipmentService } from "@/lib/api/services/booking-equipment.service";
import { AlertCircle, Package } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EquipmentReturnDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    equipment: BookingEquipment[];
    onSuccess: () => void;
}

export function EquipmentReturnDialog({ open, onOpenChange, equipment, onSuccess }: EquipmentReturnDialogProps) {
    const [loading, setLoading] = useState(false);
    const [damageInfo, setDamageInfo] = useState<{ [equipment_id: number]: DamageInfo }>({});
    const [error, setError] = useState<string | null>(null);

    const handleDamageChange = (equipmentId: number, field: keyof DamageInfo, value: any) => {
        setDamageInfo(prev => ({
            ...prev,
            [equipmentId]: {
                ...prev[equipmentId],
                [field]: value,
                // Reset charge_customer and damage_charge_amount if damage_reported is false
                ...(field === 'damage_reported' && !value ? {
                    charge_customer: false,
                    damage_charge_amount: undefined,
                    damage_description: undefined,
                    damage_cost: undefined,
                } : {}),
            }
        }));
    };

    const validateForm = (): boolean => {
        for (const [equipmentId, info] of Object.entries(damageInfo)) {
            if (info.damage_reported && !info.damage_description?.trim()) {
                setError(`Damage description is required for equipment item ${equipmentId}`);
                return false;
            }
            if (info.charge_customer && (!info.damage_charge_amount || info.damage_charge_amount <= 0)) {
                setError(`Charge amount is required when charging customer for equipment item ${equipmentId}`);
                return false;
            }
        }
        return true;
    };

    const handleReturn = async () => {
        setError(null);
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const equipmentIds = equipment.map(eq => eq.id);
            const damageData = Object.keys(damageInfo).length > 0 ? damageInfo : undefined;

            await bookingEquipmentService.bulkReturn({
                equipment_ids: equipmentIds,
                damage_info: damageData,
            });

            onSuccess();
            onOpenChange(false);
            // Reset form
            setDamageInfo({});
        } catch (err: any) {
            setError(err.message || 'Failed to return equipment');
        } finally {
            setLoading(false);
        }
    };

    const getEquipmentDisplayName = (eq: BookingEquipment): string => {
        if (eq.equipment_item?.equipment) {
            return `${eq.equipment_item.equipment.name}${eq.equipment_item.size ? ` - ${eq.equipment_item.size}` : ''}`;
        }
        if (eq.customer_equipment_type) {
            return `${eq.customer_equipment_type}${eq.customer_equipment_brand ? ` - ${eq.customer_equipment_brand}` : ''}`;
        }
        return 'Equipment';
    };

    const totalDamageCharges = Object.values(damageInfo)
        .filter(info => info.charge_customer && info.damage_charge_amount)
        .reduce((sum, info) => sum + (info.damage_charge_amount || 0), 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Return Equipment</DialogTitle>
                    <DialogDescription>
                        Review and record any damage for the selected equipment items.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        Returning {equipment.length} item{equipment.length !== 1 ? 's' : ''}
                    </div>

                    {equipment.map((eq) => {
                        const info = damageInfo[eq.id] || {};
                        const hasDamage = info.damage_reported || false;

                        return (
                            <Card key={eq.id}>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        {getEquipmentDisplayName(eq)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`damage-${eq.id}`}
                                            checked={hasDamage}
                                            onCheckedChange={(checked) =>
                                                handleDamageChange(eq.id, 'damage_reported', checked)
                                            }
                                        />
                                        <Label htmlFor={`damage-${eq.id}`} className="cursor-pointer">
                                            Report Damage
                                        </Label>
                                    </div>

                                    {hasDamage && (
                                        <div className="space-y-4 pl-6 border-l-2 border-muted">
                                            <div>
                                                <Label htmlFor={`description-${eq.id}`}>
                                                    Damage Description <span className="text-destructive">*</span>
                                                </Label>
                                                <Textarea
                                                    id={`description-${eq.id}`}
                                                    value={info.damage_description || ''}
                                                    onChange={(e) =>
                                                        handleDamageChange(eq.id, 'damage_description', e.target.value)
                                                    }
                                                    placeholder="Describe the damage..."
                                                    rows={3}
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor={`cost-${eq.id}`}>Repair Cost (Optional)</Label>
                                                <Input
                                                    id={`cost-${eq.id}`}
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={info.damage_cost || ''}
                                                    onChange={(e) =>
                                                        handleDamageChange(eq.id, 'damage_cost', e.target.value ? parseFloat(e.target.value) : undefined)
                                                    }
                                                    placeholder="0.00"
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`charge-${eq.id}`}
                                                    checked={info.charge_customer || false}
                                                    onCheckedChange={(checked) => {
                                                        handleDamageChange(eq.id, 'charge_customer', checked);
                                                        // Pre-fill charge amount with repair cost if available
                                                        if (checked && info.damage_cost && !info.damage_charge_amount) {
                                                            handleDamageChange(eq.id, 'damage_charge_amount', info.damage_cost);
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor={`charge-${eq.id}`} className="cursor-pointer">
                                                    Charge Customer
                                                </Label>
                                            </div>

                                            {info.charge_customer && (
                                                <div>
                                                    <Label htmlFor={`charge-amount-${eq.id}`}>
                                                        Charge Amount <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Input
                                                        id={`charge-amount-${eq.id}`}
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={info.damage_charge_amount || ''}
                                                        onChange={(e) =>
                                                            handleDamageChange(eq.id, 'damage_charge_amount', e.target.value ? parseFloat(e.target.value) : undefined)
                                                        }
                                                        placeholder="0.00"
                                                        className="mt-1"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}

                    {totalDamageCharges > 0 && (
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="text-sm font-medium">Total Damage Charges: ${totalDamageCharges.toFixed(2)}</div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleReturn} disabled={loading}>
                        {loading ? 'Returning...' : 'Return Equipment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

