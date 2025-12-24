"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerWithEquipment } from "@/lib/api/services/boat-list.service";
import { User, ShoppingBasket, Package, Box, Flag, Award, Building, UserCircle, Plane, Calendar } from "lucide-react";
import { safeFormatDate } from "@/lib/utils/date-format";

interface CustomerEquipmentCardProps {
    customerData: CustomerWithEquipment;
}

export function CustomerEquipmentCard({ customerData }: CustomerEquipmentCardProps) {
    const { customer, certification, equipment_basket } = customerData;

    return (
        <Card className="w-full">
            <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-semibold">{customer.full_name}</CardTitle>
                    </div>
                    {customer.email && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                            {customer.email}
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                    {customer.phone && (
                        <CardDescription className="text-xs">
                            {customer.phone}
                        </CardDescription>
                    )}
                    {customer.gender && (
                        <div className="flex items-center gap-1">
                            <UserCircle className="h-3 w-3 text-muted-foreground" />
                            <CardDescription className="text-xs">
                                {customer.gender}
                            </CardDescription>
                        </div>
                    )}
                    {customer.nationality && (
                        <div className="flex items-center gap-1">
                            <Flag className="h-3 w-3 text-muted-foreground" />
                            <CardDescription className="text-xs">
                                {customer.nationality}
                            </CardDescription>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0 space-y-1.5">
                {/* Certification Section - Compact */}
                {certification && (
                    <div className="p-1.5 border rounded-md bg-muted/20">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Award className="h-3.5 w-3.5 text-primary" />
                            <p className="text-xs font-semibold">{certification.certification_name}</p>
                        </div>
                        <div className="text-xs text-muted-foreground flex gap-2 flex-wrap pl-4">
                            {certification.agency && <span>{certification.agency}</span>}
                            {certification.certification_no && <span>No: {certification.certification_no}</span>}
                            {certification.certification_date && (
                                <span>Certified: {safeFormatDate(certification.certification_date, "MMM dd, yyyy", "N/A")}</span>
                            )}
                            {certification.no_of_dives !== undefined && certification.no_of_dives !== null && (
                                <span>Dives: {certification.no_of_dives}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Departure Information Section */}
                {(customer.departure_date || customer.departure_flight || customer.departure_flight_time || customer.departure_to) && (
                    <div className="p-1.5 border rounded-md bg-muted/20">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Plane className="h-3.5 w-3.5 text-primary" />
                            <p className="text-xs font-semibold">Departure</p>
                        </div>
                        <div className="text-xs text-muted-foreground flex gap-2 flex-wrap pl-4">
                            {customer.departure_date && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{safeFormatDate(customer.departure_date, "MMM dd, yyyy", "N/A")}</span>
                                </div>
                            )}
                            {customer.departure_flight && (
                                <div className="flex items-center gap-1">
                                    <Plane className="h-3 w-3" />
                                    <span>Flight: {customer.departure_flight}</span>
                                </div>
                            )}
                            {customer.departure_flight_time && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>Time: {customer.departure_flight_time}</span>
                                </div>
                            )}
                            {customer.departure_to && (
                                <div className="flex items-center gap-1">
                                    <span>To: {customer.departure_to}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Equipment Basket Section */}
                {equipment_basket ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <ShoppingBasket className="h-4 w-4 text-muted-foreground" />
                            <p className="text-xs font-medium">Basket: {equipment_basket.basket_no}</p>
                            {equipment_basket.center_bucket_no && (
                                <span className="text-xs text-muted-foreground">
                                    ({equipment_basket.center_bucket_no})
                                </span>
                            )}
                        </div>

                        {equipment_basket.equipment && equipment_basket.equipment.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {equipment_basket.equipment.map((equip) => (
                                    equip.equipment_source === 'Customer Own' && equip.customer_equipment ? (
                                        <Card key={equip.id} className="flex items-start gap-1.5 p-2 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors">
                                            <CardContent className="p-0 flex items-start gap-1.5 w-full">
                                                <UserCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                        <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                                                            {equip.customer_equipment.type || 'Customer Equipment'}
                                                            {equip.customer_equipment.brand && ` - ${equip.customer_equipment.brand}`}
                                                        </p>
                                                        <Badge 
                                                            variant="outline" 
                                                            className="text-xs px-1.5 py-0.5 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50"
                                                        >
                                                            Customer Own
                                                        </Badge>
                                                        {equip.assignment_status && (
                                                            <Badge 
                                                                variant={equip.assignment_status === 'Checked Out' ? 'default' : 'secondary'} 
                                                                className="text-xs px-1.5 py-0.5"
                                                            >
                                                                {equip.assignment_status}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-blue-700 dark:text-blue-300 mt-0.5 space-y-0.5">
                                                        {equip.customer_equipment.brand && (
                                                            <span className="block">Brand: {equip.customer_equipment.brand}</span>
                                                        )}
                                                        {equip.customer_equipment.model && (
                                                            <span className="block">Model: {equip.customer_equipment.model}</span>
                                                        )}
                                                        {equip.customer_equipment.serial && (
                                                            <span className="block">Serial: {equip.customer_equipment.serial}</span>
                                                        )}
                                                        {equip.customer_equipment.notes && (
                                                            <span className="block italic">Notes: {equip.customer_equipment.notes}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div key={equip.id} className="flex items-start gap-1.5 p-2 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                                            <Package className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                {equip.equipment_source === 'Center' && equip.equipment_item ? (
                                                    <div>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <p className="text-xs font-medium">
                                                                {equip.equipment_item.equipment?.name || 'Equipment'}
                                                                {equip.equipment_item.size && ` - ${equip.equipment_item.size}`}
                                                            </p>
                                                            {equip.assignment_status && (
                                                                <Badge 
                                                                    variant={equip.assignment_status === 'Checked Out' ? 'default' : 'secondary'} 
                                                                    className="text-xs px-1.5 py-0.5"
                                                                >
                                                                    {equip.assignment_status}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            {equip.equipment_item.inventory_code && (
                                                                <span className="block">Code: {equip.equipment_item.inventory_code}</span>
                                                            )}
                                                            {equip.equipment_item.brand && (
                                                                <span className="block">Brand: {equip.equipment_item.brand}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">Equipment details not available</p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground pl-4">
                                <Box className="h-4 w-4" />
                                <p>No equipment assigned</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pl-4">
                        <ShoppingBasket className="h-4 w-4" />
                        <p>No equipment basket assigned</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

