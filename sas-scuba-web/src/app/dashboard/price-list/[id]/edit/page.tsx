"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { PriceListForm } from "@/components/price-list/PriceListForm";
import { PriceListItemTable } from "@/components/price-list/PriceListItemTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, List, Package, ChevronDown, Eye, ArrowLeft, Calculator, Receipt } from "lucide-react";
import { priceListService, PriceList, PriceListItem } from "@/lib/api/services/price-list.service";
import { Separator } from "@/components/ui/separator";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BulkPriceAdjustDialog } from "@/components/price-list/BulkPriceAdjustDialog";
import { BulkUpdateTaxServiceDialog } from "@/components/price-list/BulkUpdateTaxServiceDialog";

export default function PriceListEditPage() {
    const params = useParams();
    const router = useRouter();
    const priceListId = params.id as string;
    const [priceList, setPriceList] = useState<PriceList | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInfoCardOpen, setIsInfoCardOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [bulkAdjustDialogOpen, setBulkAdjustDialogOpen] = useState(false);
    const [bulkUpdateTaxServiceDialogOpen, setBulkUpdateTaxServiceDialogOpen] = useState(false);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    const fetchPriceList = useCallback(async () => {
        if (!priceListId) return;
        
        // Validate that priceListId is a valid number (not "0" or empty)
        const numId = typeof priceListId === 'string' ? parseInt(priceListId, 10) : priceListId;
        if (isNaN(numId) || numId <= 0) {
            console.error("Invalid price list ID:", priceListId);
            setLoading(false);
            return;
        }
        
        setLoading(true);
        try {
            const data = await priceListService.getById(priceListId);
            setPriceList(data);
        } catch (error) {
            console.error("Failed to fetch price list", error);
        } finally {
            setLoading(false);
        }
    }, [priceListId]);

    useEffect(() => {
        fetchPriceList();
    }, [fetchPriceList]);

    const handlePriceListUpdate = () => {
        fetchPriceList();
    };

    const handleAddItem = () => {
        router.push(`/dashboard/price-list/${priceListId}/items/create`);
    };

    const handleEditItem = (item: PriceListItem) => {
        router.push(`/dashboard/price-list/${priceListId}/items/${item.id}/edit`);
    };


    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Price List" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!priceList) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Price List" />
                <div className="flex-1 space-y-6 p-8 pt-6">
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">Price list not found.</p>
                        <Link href="/dashboard/price-list" prefetch={false}>
                            <Button variant="outline" className="mt-4">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Price Lists
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Price List" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/price-list" prefetch={false}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{priceList.name}</h2>
                        <p className="text-muted-foreground">Manage your services and pricing.</p>
                    </div>
                </div>

                <div className="mx-auto max-w-[1400px] space-y-6">
                    <Card>
                        <Collapsible open={isInfoCardOpen} onOpenChange={setIsInfoCardOpen}>
                            <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <List className="h-5 w-5 text-primary" />
                                            <CardTitle className="text-xl">Price List Information</CardTitle>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setViewDialogOpen(true);
                                                }}
                                            >
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Price List
                                            </Button>
                                            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isInfoCardOpen ? 'transform rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                    <CardDescription>
                                        Update your price list details.
                                    </CardDescription>
                                </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent>
                                    <PriceListForm 
                                        initialData={priceList} 
                                        priceListId={priceListId}
                                        onSuccess={handlePriceListUpdate} 
                                    />
                                </CardContent>
                            </CollapsibleContent>
                        </Collapsible>
                    </Card>

                    <Separator />

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Package className="h-5 w-5 text-primary" />
                                        Price List Items
                                    </CardTitle>
                                    <CardDescription>
                                        Manage services and their prices in your base currency.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedItems.length > 0 && (
                                        <Button 
                                            variant="outline" 
                                            onClick={() => setBulkUpdateTaxServiceDialogOpen(true)}
                                            className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900"
                                        >
                                            <Receipt className="mr-2 h-4 w-4" /> 
                                            Update Tax & Service Charge ({selectedItems.length})
                                        </Button>
                                    )}
                                    <Button variant="outline" onClick={() => setBulkAdjustDialogOpen(true)}>
                                        <Calculator className="mr-2 h-4 w-4" /> Bulk Adjust Prices
                                    </Button>
                                    <Button onClick={handleAddItem}>
                                        <Plus className="mr-2 h-4 w-4" /> Add Item
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {priceList && (
                                <PriceListItemTable
                                    items={priceList.items || []}
                                    baseCurrency={priceList.base_currency || "USD"}
                                    onItemUpdated={handlePriceListUpdate}
                                    onEditItem={handleEditItem}
                                    selectedItems={selectedItems}
                                    onSelectionChange={setSelectedItems}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>


                <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <List className="h-5 w-5 text-primary" />
                                Price List Details
                            </DialogTitle>
                            <DialogDescription>
                                View your current price list information and items.
                            </DialogDescription>
                        </DialogHeader>
                        {priceList ? (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Name</h3>
                                        <p className="text-base font-medium">{priceList.name || "N/A"}</p>
                                    </div>
                                    {priceList.base_currency && (
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Base Currency</h3>
                                            <p className="text-base font-medium">{priceList.base_currency}</p>
                                        </div>
                                    )}
                                    {priceList.notes && (
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
                                            <p className="text-base whitespace-pre-wrap">{priceList.notes}</p>
                                        </div>
                                    )}
                                    {priceList.items && priceList.items.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Items ({priceList.items.length})</h3>
                                            <div className="rounded-md border">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="border-b bg-muted/50">
                                                                <th className="h-12 px-4 text-left align-middle font-medium text-sm">Service</th>
                                                                <th className="h-12 px-4 text-left align-middle font-medium text-sm">Price</th>
                                                                <th className="h-12 px-4 text-left align-middle font-medium text-sm">Currency</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {priceList.items.map((item) => (
                                                                <tr key={item.id} className="border-b">
                                                                    <td className="p-4 align-middle">{item.name || "N/A"}</td>
                                                                    <td className="p-4 align-middle">{item.price || "0.00"}</td>
                                                                    <td className="p-4 align-middle">{priceList.base_currency || "USD"}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No price list data available.
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <BulkPriceAdjustDialog
                    open={bulkAdjustDialogOpen}
                    onOpenChange={setBulkAdjustDialogOpen}
                    priceList={priceList}
                    selectedItemIds={selectedItems}
                    onSuccess={() => {
                        setSelectedItems([]);
                        handlePriceListUpdate();
                    }}
                />

                <BulkUpdateTaxServiceDialog
                    open={bulkUpdateTaxServiceDialogOpen}
                    onOpenChange={setBulkUpdateTaxServiceDialogOpen}
                    priceListId={priceListId}
                    selectedItemIds={selectedItems}
                    onSuccess={() => {
                        setSelectedItems([]);
                        handlePriceListUpdate();
                    }}
                />
            </div>
        </div>
    );
}
