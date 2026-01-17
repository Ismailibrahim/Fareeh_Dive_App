"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { bookingDiveService, BookingDive } from "@/lib/api/services/booking-dive.service";
import { safeFormatDate } from "@/lib/utils/date-format";
import { Printer } from "lucide-react";

export default function BookingDivePrintPage() {
    const params = useParams();
    const diveId = params.id as string;
    const [dive, setDive] = useState<BookingDive | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (diveId) {
            loadDive();
        }
    }, [diveId]);

    useEffect(() => {
        // Auto-print when page loads (commented out - uncomment if auto-print desired)
        // if (!loading && dive) {
        //     setTimeout(() => {
        //         window.print();
        //     }, 500);
        // }
    }, [loading, dive]);

    const loadDive = async () => {
        try {
            const data = await bookingDiveService.getById(Number(diveId));
            setDive(data);
        } catch (error) {
            console.error("Failed to load dive", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !dive) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading...</p>
            </div>
        );
    }

    const isGroupBooking = dive.booking?.dive_group !== null && dive.booking?.dive_group !== undefined;

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
                <h1 className="text-2xl font-bold mb-2">DIVE RECEIPT</h1>
                <div className="text-sm text-gray-600">
                    <p>Dive ID: <strong>#{dive.id}</strong></p>
                    {dive.booking && (
                        <p>Booking #<strong>{dive.booking.id}</strong></p>
                    )}
                </div>
            </div>

            {/* Dive Information */}
            <div className="print-section mb-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide border-b pb-2">
                    Dive Information
                </h3>
                <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                        <p><strong>Dive Site:</strong> {dive.dive_site?.name || 'N/A'}</p>
                    </div>
                    {dive.boat && (
                        <div>
                            <p><strong>Boat:</strong> {dive.boat.name}</p>
                        </div>
                    )}
                    {dive.dive_date && (
                        <div>
                            <p><strong>Dive Date:</strong> {safeFormatDate(dive.dive_date, "MMM d, yyyy", "N/A")}</p>
                        </div>
                    )}
                    {dive.dive_time && (
                        <div>
                            <p><strong>Dive Time:</strong> {dive.dive_time}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Customer/Group Information */}
            <div className="print-section mb-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide border-b pb-2">
                    {isGroupBooking ? 'Group Information' : 'Customer Information'}
                </h3>
                <div className="grid grid-cols-2 gap-6 text-sm">
                    {isGroupBooking && dive.booking?.dive_group ? (
                        <>
                            <div>
                                <p><strong>Group Name:</strong> {dive.booking.dive_group.group_name}</p>
                            </div>
                            {dive.booking.number_of_divers && (
                                <div>
                                    <p><strong>Number of Divers:</strong> {dive.booking.number_of_divers}</p>
                                </div>
                            )}
                        </>
                    ) : dive.booking?.customer ? (
                        <>
                            <div>
                                <p><strong>Customer Name:</strong> {dive.booking.customer.full_name}</p>
                            </div>
                            {dive.booking.customer.email && (
                                <div>
                                    <p><strong>Email:</strong> {dive.booking.customer.email}</p>
                                </div>
                            )}
                            {dive.booking.customer.phone && (
                                <div>
                                    <p><strong>Phone:</strong> {dive.booking.customer.phone}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div>
                            <p>Customer information not available</p>
                        </div>
                    )}
                    {dive.booking?.booking_date && (
                        <div>
                            <p><strong>Booking Date:</strong> {safeFormatDate(dive.booking.booking_date, "MMM d, yyyy", "N/A")}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Signature Section */}
            <div className="print-section mt-12 mb-8">
                <div className="border-t pt-6 space-y-6">
                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Customer Signature:</p>
                        <div className="border-b border-gray-400 pb-2" style={{ minHeight: '50px' }}></div>
                        <p className="text-xs text-gray-500 mt-1">
                            {isGroupBooking && dive.booking?.dive_group 
                                ? `Group Representative: ${dive.booking.dive_group.group_name}`
                                : dive.booking?.customer?.full_name || 'Customer Name'}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Date Signed:</p>
                            <div className="border-b border-gray-400 pb-2" style={{ minHeight: '40px' }}></div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Staff Initials:</p>
                            <div className="border-b border-gray-400 pb-2" style={{ minHeight: '40px' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="print-section mt-8 pt-4 border-t text-center text-xs text-gray-600">
                <p>This receipt confirms that the above {isGroupBooking ? 'group' : 'customer'} completed the dive on the date specified.</p>
                <p className="mt-2">This receipt serves as proof of dive completion for billing purposes.</p>
                <p className="mt-2">Generated on {safeFormatDate(new Date().toISOString(), "MMM d, yyyy 'at' h:mm a", "N/A")}</p>
            </div>
        </div>
    );
}

