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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { diveGroupService, BookGroupRequest } from "@/lib/api/services/dive-group.service";
import { diveSiteService, DiveSite } from "@/lib/api/services/dive-site.service";
import { boatService, Boat } from "@/lib/api/services/boat.service";
import { priceListItemService } from "@/lib/api/services/price-list-item.service";
import { PriceListItem } from "@/lib/api/services/price-list.service";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SafeDatePicker as DatePicker } from "@/components/ui/safe-date-picker";

interface BookGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: number;
    onSuccess?: () => void;
}

export function BookGroupDialog({
    open,
    onOpenChange,
    groupId,
    onSuccess,
}: BookGroupDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [bookingType, setBookingType] = useState<'individual' | 'group'>('individual');
    const [diveSites, setDiveSites] = useState<DiveSite[]>([]);
    const [boats, setBoats] = useState<Boat[]>([]);
    const [priceListItems, setPriceListItems] = useState<PriceListItem[]>([]);
    const [selectedPriceItem, setSelectedPriceItem] = useState<PriceListItem | null>(null);

    const [formData, setFormData] = useState<BookGroupRequest>({
        booking_type: 'individual',
        dive_site_id: 0,
        boat_id: undefined,
        dive_date: undefined,
        dive_time: undefined,
        price_list_item_id: undefined,
        price: undefined,
        booking_date: undefined,
        number_of_divers: undefined,
        status: 'Scheduled',
    });

    useEffect(() => {
        if (open) {
            fetchData();
        }
    }, [open]);

    const fetchData = async () => {
        try {
            const [diveSiteData, boatData, priceData] = await Promise.all([
                diveSiteService.getAll(),
                boatService.getAll(1, true),
                priceListItemService.getAll({ service_type: 'Dive Trip', is_active: true }),
            ]);

            const diveSiteList = Array.isArray(diveSiteData) ? diveSiteData : (diveSiteData as any).data || [];
            const boatList = Array.isArray(boatData) ? boatData : (boatData as any).data || [];
            const priceList = Array.isArray(priceData) ? priceData : [];

            setDiveSites(diveSiteList);
            setBoats(boatList);
            setPriceListItems(priceList);
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    useEffect(() => {
        if (formData.price_list_item_id) {
            const item = priceListItems.find(p => p.id === formData.price_list_item_id);
            if (item) {
                setSelectedPriceItem(item);
                setFormData(prev => ({ ...prev, price: item.price }));
            }
        }
    }, [formData.price_list_item_id, priceListItems]);

    const handleBook = async () => {
        if (!formData.dive_site_id) {
            alert("Please select a dive site");
            return;
        }

        setLoading(true);
        try {
            const request: BookGroupRequest = {
                ...formData,
                booking_type: bookingType,
            };

            const result = await diveGroupService.bookGroup(groupId, request);
            
            if (onSuccess) {
                onSuccess();
            }
            
            onOpenChange(false);
            
            // Navigate to first booking if individual bookings were created
            if (result.bookings && result.bookings.length > 0 && bookingType === 'individual') {
                router.push(`/dashboard/bookings/${result.bookings[0].id}`);
            } else if (result.bookings && result.bookings.length > 0) {
                router.push(`/dashboard/bookings/${result.bookings[0].id}`);
            }
            
            router.refresh();
        } catch (error: any) {
            console.error("Failed to book group", error);
            const errorMessage = error?.response?.data?.message || "Failed to create bookings";
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Book Dives for Group</DialogTitle>
                    <DialogDescription>
                        Create bookings for all group members at once.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Booking Type */}
                    <div className="space-y-3">
                        <Label>Booking Type</Label>
                        <RadioGroup value={bookingType} onValueChange={(value) => setBookingType(value as any)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="individual" id="individual" />
                                <Label htmlFor="individual">Individual Bookings (one per member)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="group" id="group" />
                                <Label htmlFor="group">Group Booking (single booking for all)</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Dive Site */}
                    <div className="space-y-2">
                        <Label htmlFor="dive_site">Dive Site *</Label>
                        <Select
                            value={formData.dive_site_id?.toString() || ""}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, dive_site_id: parseInt(value) }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select dive site" />
                            </SelectTrigger>
                            <SelectContent>
                                {diveSites.map((site) => (
                                    <SelectItem key={site.id} value={site.id.toString()}>
                                        {site.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Boat */}
                    <div className="space-y-2">
                        <Label htmlFor="boat">Boat</Label>
                        <Select
                            value={formData.boat_id?.toString() || "none"}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, boat_id: value === "none" ? undefined : parseInt(value) }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select boat (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No boat</SelectItem>
                                {boats.map((boat) => (
                                    <SelectItem key={boat.id} value={boat.id.toString()}>
                                        {boat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Dive Date */}
                    <div className="space-y-2">
                        <Label htmlFor="dive_date">Dive Date</Label>
                        <DatePicker
                            selected={formData.dive_date ? new Date(formData.dive_date) : undefined}
                            onChange={(date) => setFormData(prev => ({ ...prev, dive_date: date ? date.toISOString().split('T')[0] : undefined }))}
                        />
                    </div>

                    {/* Dive Time */}
                    <div className="space-y-2">
                        <Label htmlFor="dive_time">Dive Time</Label>
                        <Input
                            id="dive_time"
                            type="time"
                            value={formData.dive_time || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, dive_time: e.target.value || undefined }))}
                        />
                    </div>

                    {/* Price List Item */}
                    <div className="space-y-2">
                        <Label htmlFor="price_list_item">Price List Item</Label>
                        <Select
                            value={formData.price_list_item_id?.toString() || "none"}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, price_list_item_id: value === "none" ? undefined : parseInt(value) }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select price list item (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No price list item</SelectItem>
                                {priceListItems.map((item) => (
                                    <SelectItem key={item.id} value={item.id.toString()}>
                                        {item.name} - ${item.price}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value ? parseFloat(e.target.value) : undefined }))}
                            placeholder="Enter price"
                        />
                    </div>

                    {/* Number of Divers */}
                    <div className="space-y-2">
                        <Label htmlFor="number_of_divers">Number of Divers</Label>
                        <Input
                            id="number_of_divers"
                            type="number"
                            min="1"
                            value={formData.number_of_divers || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, number_of_divers: e.target.value ? parseInt(e.target.value) : undefined }))}
                            placeholder="Enter number of divers"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleBook} disabled={loading || !formData.dive_site_id}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Bookings...
                            </>
                        ) : (
                            "Create Bookings"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

