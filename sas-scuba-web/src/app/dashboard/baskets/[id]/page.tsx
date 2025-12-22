"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { equipmentBasketService, EquipmentBasket } from "@/lib/api/services/equipment-basket.service";
import { bookingEquipmentService } from "@/lib/api/services/booking-equipment.service";
import { ShoppingBasket, Calendar, User, Package, Plus, RotateCcw, Layers, ArrowLeft } from "lucide-react";
import { safeFormatDate } from "@/lib/utils/date-format";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BulkAddEquipmentDialog } from "@/components/booking-equipment/BulkAddEquipmentDialog";
import { EquipmentReturnDialog } from "@/components/booking-equipment/EquipmentReturnDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function BasketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const basketId = params.id as string;
    const [basket, setBasket] = useState<EquipmentBasket | null>(null);
    const [loading, setLoading] = useState(true);
    const [bulkAddDialogOpen, setBulkAddDialogOpen] = useState(false);
    const [returnDialogOpen, setReturnDialogOpen] = useState(false);
    const [equipmentSourceFilter, setEquipmentSourceFilter] = useState<string>('');
    const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (basketId) {
            loadBasket();
        }
    }, [basketId]);

    // Reload basket when URL has refresh parameter (from create page)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('refresh') === 'true') {
            // Remove the refresh parameter from URL
            window.history.replaceState({}, '', window.location.pathname);
            // Reload basket after a short delay
            setTimeout(() => {
                loadBasket();
            }, 300);
        }
    }, [basketId]);

    const loadBasket = async () => {
        try {
            const data = await equipmentBasketService.getById(Number(basketId));
            console.log("Loaded basket data:", data);
            // Handle both camelCase and snake_case response formats
            const bookingEquipment = (data as any).booking_equipment || (data as any).bookingEquipment || [];
            console.log("Booking equipment:", bookingEquipment);
            // Normalize the data to use snake_case
            const normalizedData = {
                ...data,
                booking_equipment: bookingEquipment
            };
            setBasket(normalizedData as EquipmentBasket);
        } catch (error) {
            console.error("Failed to load basket", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReturnBasket = async () => {
        if (!basket) return;
        if (!confirm('Are you sure you want to return this basket? This will mark all equipment as returned.')) {
            return;
        }

        try {
            await equipmentBasketService.returnBasket(basket.id);
            loadBasket();
        } catch (error) {
            console.error("Failed to return basket", error);
        }
    };

    const handleReturnEquipment = async (equipmentId: number) => {
        if (!confirm('Are you sure you want to return this equipment item?')) {
            return;
        }

        try {
            await bookingEquipmentService.returnEquipment(equipmentId);
            loadBasket();
        } catch (error) {
            console.error("Failed to return equipment", error);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (!basket?.booking_equipment) return;
        const nonReturnedEquipment = basket.booking_equipment.filter(
            eq => eq.assignment_status !== 'Returned'
        );
        if (checked) {
            setSelectedEquipmentIds(new Set(nonReturnedEquipment.map(eq => eq.id)));
        } else {
            setSelectedEquipmentIds(new Set());
        }
    };

    const handleSelectEquipment = (equipmentId: number, checked: boolean) => {
        const newSet = new Set(selectedEquipmentIds);
        if (checked) {
            newSet.add(equipmentId);
        } else {
            newSet.delete(equipmentId);
        }
        setSelectedEquipmentIds(newSet);
    };

    const handleReturnSelected = () => {
        if (selectedEquipmentIds.size === 0) {
            alert('Please select at least one equipment item to return');
            return;
        }
        setReturnDialogOpen(true);
    };

    const isAllSelected = () => {
        if (!basket?.booking_equipment) return false;
        const nonReturnedEquipment = basket.booking_equipment.filter(
            eq => eq.assignment_status !== 'Returned'
        );
        return nonReturnedEquipment.length > 0 && 
               nonReturnedEquipment.every(eq => selectedEquipmentIds.has(eq.id));
    };

    const getSelectedEquipment = () => {
        if (!basket?.booking_equipment) return [];
        return basket.booking_equipment.filter(eq => selectedEquipmentIds.has(eq.id));
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Equipment Basket" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center py-8">Loading basket...</div>
                </div>
            </div>
        );
    }

    if (!basket) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Equipment Basket" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-muted-foreground mb-4">Basket not found</p>
                        <Link href="/dashboard/baskets">
                            <Button variant="outline">
                                Back to Baskets
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Equipment Basket" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/baskets">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                                <span className="sr-only">Back</span>
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">
                                {basket.center_bucket_no || basket.basket_no}
                            </h2>
                            {basket.center_bucket_no && (
                                <p className="text-sm text-muted-foreground font-mono">
                                    System: {basket.basket_no}
                                </p>
                            )}
                            <p className="text-muted-foreground">
                                {basket.customer?.full_name || 'Unknown Customer'}
                            </p>
                        </div>
                    </div>
                    {basket.status === 'Active' && (
                        <Button onClick={handleReturnBasket} variant="outline">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Return Basket
                        </Button>
                    )}
                </div>

            {/* Basket Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Equipment Items
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{basket.booking_equipment?.length || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Checkout Date
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg">
                            {safeFormatDate(basket.checkout_date, "MMM d, yyyy", "N/A")}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">{basket.status}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Basket Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Basket Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Basket Number</label>
                            <p className="font-mono">{basket.basket_no}</p>
                        </div>
                        {basket.center_bucket_no && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Center Bucket No</label>
                                <p className="font-mono">{basket.center_bucket_no}</p>
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Customer</label>
                            <p>{basket.customer?.full_name || 'N/A'}</p>
                        </div>
                        {basket.booking && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Booking</label>
                                <p>
                                    <Link href={`/dashboard/bookings/${basket.booking.id}`} className="hover:underline">
                                        Booking #{basket.booking.id}
                                    </Link>
                                </p>
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Expected Return</label>
                            <p>{safeFormatDate(basket.expected_return_date, "MMM d, yyyy", "N/A")}</p>
                        </div>
                        {basket.actual_return_date && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Actual Return</label>
                                <p>{safeFormatDate(basket.actual_return_date, "MMM d, yyyy", "N/A")}</p>
                            </div>
                        )}
                    </div>
                    {basket.notes && (
                        <div className="mt-4">
                            <label className="text-sm font-medium text-muted-foreground">Notes</label>
                            <p className="mt-1">{basket.notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Equipment List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Equipment Items</CardTitle>
                            <CardDescription>Equipment assigned to this basket</CardDescription>
                        </div>
                        {basket.status === 'Active' && (
                            <div className="flex gap-2">
                                {selectedEquipmentIds.size > 0 && (
                                    <Button 
                                        size="sm" 
                                        variant="default"
                                        onClick={handleReturnSelected}
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Return Selected ({selectedEquipmentIds.size})
                                    </Button>
                                )}
                                {basket.booking_equipment && basket.booking_equipment.length > 0 && (
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={handleReturnBasket}
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Return All Equipment
                                    </Button>
                                )}
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setBulkAddDialogOpen(true)}
                                >
                                    <Layers className="h-4 w-4 mr-2" />
                                    Bulk Add
                                </Button>
                                <Link href={`/dashboard/booking-equipment/create?basket_id=${basket.id}`}>
                                    <Button size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Equipment
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </CardHeader>
                {basket.booking_equipment && basket.booking_equipment.length > 0 && (
                    <div className="px-6 pb-4">
                        <select
                            className="px-3 py-2 border rounded-md text-sm"
                            value={equipmentSourceFilter}
                            onChange={(e) => setEquipmentSourceFilter(e.target.value)}
                        >
                            <option value="">All Equipment Types</option>
                            <option value="Center">Center Equipment</option>
                            <option value="Customer Own">Customer Own Equipment</option>
                        </select>
                    </div>
                )}
                <CardContent>
                    {!basket.booking_equipment || basket.booking_equipment.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">No equipment assigned</p>
                            {basket.status === 'Active' && (
                                <div className="flex gap-2 justify-center">
                                    <Button 
                                        variant="outline"
                                        onClick={() => setBulkAddDialogOpen(true)}
                                    >
                                        <Layers className="h-4 w-4 mr-2" />
                                        Bulk Add Equipment
                                    </Button>
                                    <Link href={`/dashboard/booking-equipment/create?basket_id=${basket.id}`}>
                                        <Button variant="outline">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Single Equipment
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {basket.status === 'Active' && basket.booking_equipment && basket.booking_equipment.filter(
                                eq => eq.assignment_status !== 'Returned'
                            ).length > 0 && (
                                <div className="flex items-center space-x-2 p-2 border-b">
                                    <Checkbox
                                        id="select-all"
                                        checked={isAllSelected()}
                                        onCheckedChange={handleSelectAll}
                                    />
                                    <Label htmlFor="select-all" className="cursor-pointer text-sm font-medium">
                                        Select All
                                    </Label>
                                </div>
                            )}
                            {basket.booking_equipment
                                .filter((equipment) => {
                                    if (!equipmentSourceFilter) return true;
                                    return equipment.equipment_source === equipmentSourceFilter;
                                })
                                .map((equipment) => (
                                <div key={equipment.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            {basket.status === 'Active' && equipment.assignment_status !== 'Returned' && (
                                                <Checkbox
                                                    id={`equipment-${equipment.id}`}
                                                    checked={selectedEquipmentIds.has(equipment.id)}
                                                    onCheckedChange={(checked) => handleSelectEquipment(equipment.id, checked as boolean)}
                                                    className="mt-1"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-medium">
                                                        {equipment.equipment_item?.equipment?.name || 
                                                         (equipment.customer_equipment_type ? `${equipment.customer_equipment_type} - ` : '') + 
                                                         (equipment.customer_equipment_brand || 'Equipment')}
                                                        {equipment.equipment_item?.size && ` - ${equipment.equipment_item.size}`}
                                                    </p>
                                                    <Badge variant={equipment.equipment_source === 'Center' ? 'default' : 'secondary'}>
                                                        {equipment.equipment_source}
                                                    </Badge>
                                                    {equipment.damage_reported && (
                                                        <Badge variant="destructive">
                                                            Damage Reported
                                                        </Badge>
                                                    )}
                                                    {equipment.charge_customer && equipment.damage_charge_amount && (
                                                        <Badge variant="outline">
                                                            Charge: ${Number(equipment.damage_charge_amount).toFixed(2)}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {equipment.checkout_date && `Checkout: ${safeFormatDate(equipment.checkout_date, "MMM d, yyyy", "N/A")}`}
                                                    {equipment.checkout_date && equipment.return_date && ' • '}
                                                    {equipment.return_date && `Return: ${safeFormatDate(equipment.return_date, "MMM d, yyyy", "N/A")}`}
                                                </p>
                                                {equipment.damage_description && (
                                                    <p className="text-xs text-destructive mt-1">
                                                        Damage: {equipment.damage_description}
                                                    </p>
                                                )}
                                                {equipment.customer_equipment_brand && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {equipment.customer_equipment_brand} 
                                                        {equipment.customer_equipment_model && ` ${equipment.customer_equipment_model}`}
                                                        {equipment.customer_equipment_serial && ` (SN: ${equipment.customer_equipment_serial})`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            {Number(equipment.price || 0) > 0 && (
                                                <p className="font-semibold">${Number(equipment.price || 0).toFixed(2)}</p>
                                            )}
                                            <Badge 
                                                variant={
                                                    equipment.assignment_status === 'Returned' ? 'default' :
                                                    equipment.assignment_status === 'Checked Out' ? 'secondary' :
                                                    equipment.assignment_status === 'Lost' ? 'destructive' : 'outline'
                                                }
                                            >
                                                {equipment.assignment_status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Bulk Add Dialog */}
            {basket && (
                <BulkAddEquipmentDialog
                    open={bulkAddDialogOpen}
                    onOpenChange={setBulkAddDialogOpen}
                    basketId={basket.id}
                    onSuccess={() => {
                        loadBasket();
                    }}
                />
            )}

            {/* Return Dialog */}
            {basket && (
                <EquipmentReturnDialog
                    open={returnDialogOpen}
                    onOpenChange={setReturnDialogOpen}
                    equipment={getSelectedEquipment()}
                    onSuccess={() => {
                        loadBasket();
                        setSelectedEquipmentIds(new Set());
                    }}
                />
            )}
            </div>
        </div>
    );
}

