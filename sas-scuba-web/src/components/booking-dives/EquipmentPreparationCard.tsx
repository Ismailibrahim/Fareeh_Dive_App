"use client";

import { useState, useEffect } from "react";
import { customerService } from "@/lib/api/services/customer.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Backpack, User, Calendar as CalendarIcon, Loader2, ShoppingCart, CheckCircle2, Info } from "lucide-react";
import { safeFormatDate } from "@/lib/utils/date-format";

interface EquipmentPreparationCardProps {
    customerIds: (string | number)[];
    customerNames?: Record<number, string>;
}

export function EquipmentPreparationCard({ customerIds, customerNames = {} }: EquipmentPreparationCardProps) {
    const [equipmentData, setEquipmentData] = useState<Record<number, any>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!customerIds || customerIds.length === 0) {
                setEquipmentData({});
                return;
            }
            
            setLoading(true);
            try {
                const data: Record<number, any> = {};
                await Promise.all(customerIds.map(async (id) => {
                    if (!id) return;
                    try {
                        const response = await customerService.getEquipmentRequest(id);
                        if (response?.data) {
                            data[Number(id)] = response.data;
                        }
                    } catch (err) {
                        console.error(`Failed to fetch equipment for customer ${id}:`, err);
                    }
                }));
                setEquipmentData(data);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [JSON.stringify(customerIds)]);

    if (loading && Object.keys(equipmentData).length === 0) {
        return (
            <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-lg bg-white dark:bg-slate-900">
                <CardContent className="p-12 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading equipment details...</p>
                </CardContent>
            </Card>
        );
    }

    const validIdsWithData = customerIds.filter(id => {
        const eq = equipmentData[Number(id)];
        return eq && eq.booking_equipment && eq.booking_equipment.length > 0;
    });

    if (validIdsWithData.length === 0 && !loading) {
        return (
            <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-lg bg-white dark:bg-slate-900">
                <CardContent className="p-12 flex flex-col items-center justify-center space-y-2 text-center">
                    <Backpack className="h-10 w-10 text-slate-200 mb-2" />
                    <p className="text-lg font-medium text-slate-900 dark:text-slate-100">No Equipment Data</p>
                    <p className="text-sm text-muted-foreground max-w-[250px]">No equipment requirements found for the selected customer(s).</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-lg overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="py-4 px-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                    <Backpack className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        Equipment Preparation
                    </CardTitle>
                    {loading && <Loader2 className="ml-auto h-5 w-5 animate-spin text-primary/40" />}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {customerIds.map(id => {
                        const equipment = equipmentData[Number(id)];
                        if (!equipment && !loading) return null;
                        
                        const items = equipment?.booking_equipment || [];
                        const rentalItems = items.filter((i: any) => i.equipment_source === 'Center');
                        const ownItems = items.filter((i: any) => i.equipment_source === 'Customer Own');

                        if (rentalItems.length === 0 && ownItems.length === 0 && !equipment?.notes && !loading) return null;

                        return (
                            <div key={id} className="p-6 space-y-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                            <User className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                                {customerNames[Number(id)] || equipment?.customer?.full_name || `Customer #${id}`}
                                            </h4>
                                            {equipment?.expected_return_date && (
                                                <span className="text-[11px] font-medium text-primary uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    Return: {safeFormatDate(equipment.expected_return_date, "MMM d")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        {rentalItems.length > 0 && (
                                            <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold px-2 py-0.5 uppercase">
                                                {rentalItems.length} Rental
                                            </Badge>
                                        )}
                                        {ownItems.length > 0 && (
                                            <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 uppercase text-slate-500 border-slate-200">
                                                {ownItems.length} Own
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-1 flex items-center gap-2">
                                            <ShoppingCart className="h-4 w-4" />
                                            Center Equipment (Rental)
                                        </p>
                                        {rentalItems.length > 0 ? (
                                            <div className="space-y-2.5">
                                                {rentalItems.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex items-start gap-3">
                                                        <div className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0 opacity-70" />
                                                        <div className="leading-tight">
                                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.customer_equipment_type}</span>
                                                            {item.customer_equipment_notes && (
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                                                                    {item.customer_equipment_notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic py-2 border border-dashed border-slate-100 rounded-lg p-4 text-center">No center gear requested</p>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Personal Equipment
                                        </p>
                                        {ownItems.length > 0 ? (
                                            <div className="space-y-2.5">
                                                {ownItems.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex items-start gap-3">
                                                        <div className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                                        <div className="leading-tight">
                                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.customer_equipment_type}</span>
                                                            {item.customer_equipment_notes && (
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                                                                    {item.customer_equipment_notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic py-2 border border-dashed border-slate-100 rounded-lg p-4 text-center">No personal gear listed</p>
                                        )}
                                    </div>
                                </div>
                                
                                {equipment?.notes && (
                                    <div className="mt-4 p-4 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl flex gap-3">
                                        <Info className="h-5 w-5 text-primary shrink-0 opacity-80" />
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Preparation Note</span>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                {equipment.notes}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
