"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PriceListItemTier, PriceListItemTierFormData } from "@/lib/api/services/price-list.service";
import { priceListItemService } from "@/lib/api/services/price-list-item.service";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PriceTierManagerProps {
    itemId: number;
    pricingModel: 'SINGLE' | 'RANGE' | 'TIERED';
}

export function PriceTierManager({ itemId, pricingModel }: PriceTierManagerProps) {
    const [tiers, setTiers] = useState<PriceListItemTier[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingTier, setEditingTier] = useState<PriceListItemTier | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<PriceListItemTierFormData>({
        tier_name: '',
        from_dives: 1,
        to_dives: 1,
        price_per_dive: 0,
        total_price: undefined,
        is_active: true,
        sort_order: 0,
    });

    useEffect(() => {
        if (pricingModel === 'TIERED' && itemId) {
            loadTiers();
        }
    }, [itemId, pricingModel]);

    const loadTiers = async () => {
        try {
            setLoading(true);
            const data = await priceListItemService.getTiers(itemId);
            setTiers(data.sort((a, b) => a.from_dives - b.from_dives));
        } catch (error) {
            console.error('Failed to load tiers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTier = () => {
        setEditingTier(null);
        setFormData({
            tier_name: '',
            from_dives: tiers.length > 0 ? (Math.max(...tiers.map(t => t.to_dives)) + 1) : 1,
            to_dives: tiers.length > 0 ? (Math.max(...tiers.map(t => t.to_dives)) + 1) : 1,
            price_per_dive: 0,
            total_price: undefined,
            is_active: true,
            sort_order: tiers.length,
        });
        setIsDialogOpen(true);
    };

    const handleEditTier = (tier: PriceListItemTier) => {
        setEditingTier(tier);
        setFormData({
            tier_name: tier.tier_name || '',
            from_dives: tier.from_dives,
            to_dives: tier.to_dives,
            price_per_dive: tier.price_per_dive,
            total_price: tier.total_price,
            is_active: tier.is_active,
            sort_order: tier.sort_order,
        });
        setIsDialogOpen(true);
    };

    const handleSaveTier = async () => {
        try {
            setLoading(true);
            if (editingTier) {
                await priceListItemService.updateTier(itemId, editingTier.id, formData);
            } else {
                await priceListItemService.createTier(itemId, formData);
            }
            setIsDialogOpen(false);
            await loadTiers();
        } catch (error) {
            console.error('Failed to save tier:', error);
            alert('Failed to save tier. Please check that tier ranges do not overlap.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTier = async (tierId: number) => {
        if (!confirm('Are you sure you want to delete this tier?')) {
            return;
        }
        try {
            setLoading(true);
            await priceListItemService.deleteTier(itemId, tierId);
            await loadTiers();
        } catch (error) {
            console.error('Failed to delete tier:', error);
        } finally {
            setLoading(false);
        }
    };

    if (pricingModel !== 'TIERED') {
        return null;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Price Tiers</Label>
                <Button onClick={handleAddTier} size="sm" disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tier
                </Button>
            </div>

            {loading && tiers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Loading tiers...</p>
            ) : tiers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tiers configured. Add a tier to get started.</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tier Name</TableHead>
                            <TableHead>From Dives</TableHead>
                            <TableHead>To Dives</TableHead>
                            <TableHead>Price Per Dive</TableHead>
                            <TableHead>Total Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tiers.map((tier) => (
                            <TableRow key={tier.id}>
                                <TableCell>{tier.tier_name || `Tier ${tier.id}`}</TableCell>
                                <TableCell>{tier.from_dives}</TableCell>
                                <TableCell>{tier.to_dives}</TableCell>
                                <TableCell>${tier.price_per_dive.toFixed(2)}</TableCell>
                                <TableCell>{tier.total_price ? `$${tier.total_price.toFixed(2)}` : '-'}</TableCell>
                                <TableCell>{tier.is_active ? 'Active' : 'Inactive'}</TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditTier(tier)}
                                            disabled={loading}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteTier(tier.id)}
                                            disabled={loading}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingTier ? 'Edit Tier' : 'Add Tier'}</DialogTitle>
                        <DialogDescription>
                            Configure the dive count range and pricing for this tier.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="tier_name">Tier Name (optional)</Label>
                            <Input
                                id="tier_name"
                                value={formData.tier_name || ''}
                                onChange={(e) => setFormData({ ...formData, tier_name: e.target.value })}
                                placeholder="e.g., First 5 dives"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="from_dives">From Dives</Label>
                                <Input
                                    id="from_dives"
                                    type="number"
                                    min="1"
                                    value={formData.from_dives}
                                    onChange={(e) => setFormData({ ...formData, from_dives: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="to_dives">To Dives</Label>
                                <Input
                                    id="to_dives"
                                    type="number"
                                    min="1"
                                    value={formData.to_dives}
                                    onChange={(e) => setFormData({ ...formData, to_dives: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="price_per_dive">Price Per Dive</Label>
                            <Input
                                id="price_per_dive"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.price_per_dive}
                                onChange={(e) => setFormData({ ...formData, price_per_dive: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="total_price">Total Price (optional, for fixed package price)</Label>
                            <Input
                                id="total_price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.total_price || ''}
                                onChange={(e) => setFormData({ ...formData, total_price: e.target.value ? parseFloat(e.target.value) : undefined })}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveTier} disabled={loading || formData.from_dives > formData.to_dives}>
                                {loading ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

