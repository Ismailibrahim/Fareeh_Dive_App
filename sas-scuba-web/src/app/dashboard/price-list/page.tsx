"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, List, Edit, Trash2, Eye, Copy, Star, CheckCircle } from "lucide-react";
import { priceListService, PriceList, PaginatedResponse } from "@/lib/api/services/price-list.service";
import Link from "next/link";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { CopyPriceListDialog } from "@/components/price-list/CopyPriceListDialog";

export default function PriceListsPage() {
    const [priceLists, setPriceLists] = useState<PriceList[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [priceListToDelete, setPriceListToDelete] = useState<PriceList | null>(null);
    const [copyDialogOpen, setCopyDialogOpen] = useState(false);
    const [priceListToCopy, setPriceListToCopy] = useState<PriceList | null>(null);
    const router = useRouter();

    const fetchPriceLists = async () => {
        setLoading(true);
        try {
            const response = await priceListService.getAll(1, 100);
            setPriceLists(response.data);
        } catch (error) {
            console.error("Failed to fetch price lists", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPriceLists();
    }, []);

    const handleDeleteClick = (priceList: PriceList) => {
        setPriceListToDelete(priceList);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!priceListToDelete) return;

        try {
            await priceListService.delete(priceListToDelete.id);
            setDeleteDialogOpen(false);
            setPriceListToDelete(null);
            fetchPriceLists();
        } catch (error) {
            console.error("Failed to delete price list", error);
        }
    };

    const handleCopyClick = (priceList: PriceList) => {
        setPriceListToCopy(priceList);
        setCopyDialogOpen(true);
    };

    const handleCopySuccess = (newPriceList: PriceList) => {
        setCopyDialogOpen(false);
        setPriceListToCopy(null);
        fetchPriceLists();
        // Redirect to the new price list edit page
        router.push(`/dashboard/price-list/${newPriceList.id}/edit`);
    };

    const handleSetDefault = async (priceList: PriceList) => {
        try {
            await priceListService.update(priceList.id, {
                name: priceList.name,
                notes: priceList.notes,
                is_default: true,
            });
            fetchPriceLists();
        } catch (error) {
            console.error("Failed to set default price list", error);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Price Lists" />
                <div className="flex-1 space-y-6 p-8 pt-6">
                    <div className="text-center py-8">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Price Lists" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Price Lists</h2>
                        <p className="text-muted-foreground">Manage your price lists and services.</p>
                    </div>
                    <Link href="/dashboard/price-list/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Price List
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {priceLists.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No price lists found</h3>
                            <p className="text-muted-foreground mb-4">
                                Get started by creating your first price list.
                            </p>
                            <Link href="/dashboard/price-list/create">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Price List
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        priceLists.map((priceList) => (
                            <Card key={priceList.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="flex items-center gap-2">
                                                <List className="h-5 w-5 text-primary" />
                                                {priceList.name}
                                            </CardTitle>
                                            <CardDescription className="mt-2">
                                                {priceList.notes || "No description"}
                                            </CardDescription>
                                        </div>
                                        {priceList.is_default && (
                                            <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white gap-1 py-1">
                                                <Star className="h-3 w-3 fill-current" />
                                                Default
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Items</span>
                                            <Badge variant="secondary">
                                                {priceList.items?.length || 0}
                                            </Badge>
                                        </div>
                                        {priceList.base_currency && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Currency</span>
                                                <Badge variant="outline">
                                                    {priceList.base_currency}
                                                </Badge>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 pt-2 border-t">
                                            <Link href={`/dashboard/price-list/${priceList.id}/edit`} className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full">
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCopyClick(priceList)}
                                                title="Copy price list"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteClick(priceList)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            {!priceList.is_default && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSetDefault(priceList)}
                                                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 ml-auto"
                                                    title="Set as global default"
                                                >
                                                    <Star className="mr-1 h-4 w-4" />
                                                    Set Default
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Price List</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{priceListToDelete?.name}"? This action cannot be undone and will also delete all items in this price list.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <CopyPriceListDialog
                open={copyDialogOpen}
                onOpenChange={setCopyDialogOpen}
                priceList={priceListToCopy}
                onSuccess={handleCopySuccess}
            />
        </div>
    );
}

