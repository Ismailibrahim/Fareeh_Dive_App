"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { equipmentBasketService, EquipmentBasket } from "@/lib/api/services/equipment-basket.service";
import { safeFormatDate } from "@/lib/utils/date-format";
import { Printer } from "lucide-react";

export default function BasketPrintPage() {
    const params = useParams();
    const basketId = params.id as string;
    const [basket, setBasket] = useState<EquipmentBasket | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (basketId) {
            loadBasket();
        }
    }, [basketId]);

    useEffect(() => {
        // Auto-print when page loads
        window.addEventListener('load', () => {
            setTimeout(() => {
                window.print();
            }, 500);
        });
    }, []);

    const loadBasket = async () => {
        try {
            const data = await equipmentBasketService.getById(Number(basketId));
            const bookingEquipment = (data as any).booking_equipment || (data as any).bookingEquipment || [];
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

    if (loading || !basket) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading...</p>
            </div>
        );
    }

    const centerEquipment = basket.booking_equipment?.filter(eq => eq.equipment_source === 'Center') || [];
    const customerEquipment = basket.booking_equipment?.filter(eq => eq.equipment_source === 'Customer Own') || [];

    return (
        <div className="basket-print-container print-card bg-white p-8">
            {/* Print Button (hidden when printing) */}
            <div className="no-print mb-4 flex gap-2">
                <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                >
                    <Printer className="h-4 w-4" />
                    Print Receipt
                </button>
                <button
                    onClick={() => window.close()}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                    Close
                </button>
            </div>

            {/* Receipt Header */}
            <div className="print-section mb-8 text-center border-b pb-4">
                <h1 className="text-2xl font-bold mb-2">EQUIPMENT RENTAL RECEIPT</h1>
                <div className="text-sm text-gray-600">
                    <p>Basket Number: <strong>{basket.basket_no}</strong></p>
                    {basket.center_bucket_no && (
                        <p>Center Bucket: <strong>{basket.center_bucket_no}</strong></p>
                    )}
                </div>
            </div>

            {/* Customer Information */}
            <div className="print-section mb-8 grid grid-cols-2 gap-8">
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Customer:</h3>
                    <div className="text-sm">
                        <p className="font-semibold text-base mb-1">{basket.customer?.full_name || 'N/A'}</p>
                        {basket.customer?.email && <p>{basket.customer.email}</p>}
                        {basket.customer?.phone && <p>{basket.customer.phone}</p>}
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Dates:</h3>
                    <div className="text-sm">
                        <p><strong>Checkout Date:</strong> {basket.checkout_date ? safeFormatDate(basket.checkout_date, "MMM d, yyyy", "N/A") : "N/A"}</p>
                        {basket.expected_return_date && (
                            <p><strong>Expected Return:</strong> {safeFormatDate(basket.expected_return_date, "MMM d, yyyy", "N/A")}</p>
                        )}
                        {basket.actual_return_date && (
                            <p><strong>Actual Return:</strong> {safeFormatDate(basket.actual_return_date, "MMM d, yyyy", "N/A")}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Center Equipment */}
            {centerEquipment.length > 0 && (
                <div className="print-section mb-8">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide border-b pb-2">
                        Center Equipment Assigned
                    </h3>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">#</th>
                                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">Equipment</th>
                                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">Serial Number</th>
                                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">Inventory Code</th>
                                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">Checkout Date</th>
                                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">Return Date</th>
                                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {centerEquipment.map((equipment, index) => (
                                <tr key={equipment.id}>
                                    <td className="border border-gray-300 px-4 py-2 text-xs">{index + 1}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-xs">
                                        {equipment.equipment_item?.equipment?.name || 'Equipment'}
                                        {equipment.equipment_item?.size && ` - ${equipment.equipment_item.size}`}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-xs font-mono">
                                        {equipment.equipment_item?.serial_no || 'N/A'}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-xs font-mono">
                                        {equipment.equipment_item?.inventory_code || 'N/A'}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-xs">
                                        {equipment.checkout_date ? safeFormatDate(equipment.checkout_date, "MMM d, yyyy", "N/A") : "N/A"}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-xs">
                                        {equipment.return_date ? safeFormatDate(equipment.return_date, "MMM d, yyyy", "N/A") : "N/A"}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-xs">
                                        {equipment.assignment_status || 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Customer Own Equipment */}
            {customerEquipment.length > 0 && (
                <div className="print-section mb-8">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide border-b pb-2">
                        Customer Own Equipment (Tracked)
                    </h3>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">#</th>
                                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">Equipment Type</th>
                                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">Brand/Model</th>
                                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">Serial Number</th>
                                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">Checkout Date</th>
                                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">Return Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customerEquipment.map((equipment, index) => (
                                <tr key={equipment.id}>
                                    <td className="border border-gray-300 px-4 py-2 text-xs">{index + 1}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-xs">
                                        {equipment.customer_equipment_type || 'N/A'}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-xs">
                                        {equipment.customer_equipment_brand || ''}
                                        {equipment.customer_equipment_model && ` ${equipment.customer_equipment_model}`}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-xs font-mono">
                                        {equipment.customer_equipment_serial || 'N/A'}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-xs">
                                        {equipment.checkout_date ? safeFormatDate(equipment.checkout_date, "MMM d, yyyy", "N/A") : "N/A"}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-xs">
                                        {equipment.return_date ? safeFormatDate(equipment.return_date, "MMM d, yyyy", "N/A") : "N/A"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Notes */}
            {basket.notes && (
                <div className="print-section mb-8">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Notes:</h3>
                    <p className="text-sm">{basket.notes}</p>
                </div>
            )}

            {/* Footer */}
            <div className="print-section mt-8 pt-4 border-t text-center text-xs text-gray-600">
                <p>This receipt confirms the equipment assignment for the above customer.</p>
                <p className="mt-2">Generated on {safeFormatDate(new Date().toISOString(), "MMM d, yyyy 'at' h:mm a", "N/A")}</p>
            </div>
        </div>
    );
}

