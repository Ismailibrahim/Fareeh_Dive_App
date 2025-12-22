"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { equipmentBasketService, EquipmentBasket } from "@/lib/api/services/equipment-basket.service";
import { useRouter } from "next/navigation";
import { Plus, ShoppingBasket, Search, MoreHorizontal, Eye, Calendar, Package } from "lucide-react";
import Link from "next/link";
import { safeFormatDate } from "@/lib/utils/date-format";

export default function BasketsPage() {
    const router = useRouter();
    const [baskets, setBaskets] = useState<EquipmentBasket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadBaskets();
    }, []);

    // Refresh data when page comes into focus (e.g., when navigating back from detail page)
    useEffect(() => {
        const handleFocus = () => {
            loadBaskets();
        };
        
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const loadBaskets = async () => {
        setLoading(true);
        try {
            const data = await equipmentBasketService.getAll();
            const basketList = Array.isArray(data) ? data : (data as any).data || [];
            setBaskets(basketList);
        } catch (error) {
            console.error("Failed to load baskets", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-800';
            case 'Returned':
                return 'bg-blue-100 text-blue-800';
            case 'Lost':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Active':
                return 'default';
            case 'Returned':
                return 'secondary';
            case 'Lost':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const filteredBaskets = baskets.filter(basket => {
        // Search filter
        const matchesSearch = basket.basket_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            basket.center_bucket_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            basket.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            basket.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
    });

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Equipment Baskets" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Equipment Baskets</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/baskets/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> New Basket
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search baskets..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="rounded-md border hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Basket No</TableHead>
                                <TableHead>Dive Center Bkt No</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Checkout Date</TableHead>
                                <TableHead>Expected Return</TableHead>
                                <TableHead>Actual Return</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredBaskets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center">
                                        No baskets found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBaskets.map((basket) => (
                                    <TableRow key={basket.id}>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={`/dashboard/baskets/${basket.id}`}
                                                className="hover:underline flex items-center gap-2"
                                            >
                                                <ShoppingBasket className="h-4 w-4 text-muted-foreground" />
                                                {basket.basket_no}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            {basket.center_bucket_no ? (
                                                <span className="font-medium">{basket.center_bucket_no}</span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {basket.customer?.full_name || 'Unknown Customer'}
                                        </TableCell>
                                        <TableCell>
                                            {basket.checkout_date ? (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {safeFormatDate(basket.checkout_date, "MMM d, yyyy", "-")}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {basket.expected_return_date ? (
                                                safeFormatDate(basket.expected_return_date, "MMM d, yyyy", "-")
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {basket.actual_return_date ? (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {safeFormatDate(basket.actual_return_date, "MMM d, yyyy", "-")}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-muted-foreground" />
                                                {basket.booking_equipment?.length || 0} items
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(basket.status)}>
                                                {basket.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/baskets/${basket.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {loading ? (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">Loading...</p>
                            </CardContent>
                        </Card>
                    ) : filteredBaskets.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <ShoppingBasket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No baskets found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredBaskets.map((basket) => (
                            <Card key={basket.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2 flex-1">
                                            <Link
                                                href={`/dashboard/baskets/${basket.id}`}
                                                className="font-semibold text-lg hover:underline flex items-center gap-2"
                                            >
                                                <ShoppingBasket className="h-5 w-5 text-muted-foreground" />
                                                {basket.basket_no}
                                            </Link>
                                            {basket.center_bucket_no && (
                                                <p className="text-sm text-muted-foreground">
                                                    Center: {basket.center_bucket_no}
                                                </p>
                                            )}
                                            <Badge variant={getStatusVariant(basket.status)} className="w-fit">
                                                {basket.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <CardDescription className="mb-1">Customer</CardDescription>
                                        <p className="font-medium">
                                            {basket.customer?.full_name || 'Unknown Customer'}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {basket.checkout_date && (
                                            <div>
                                                <CardDescription className="mb-1">Checkout</CardDescription>
                                                <p className="text-sm">
                                                    {safeFormatDate(basket.checkout_date, "MMM d, yyyy", "-")}
                                                </p>
                                            </div>
                                        )}
                                        {basket.expected_return_date && (
                                            <div>
                                                <CardDescription className="mb-1">Expected Return</CardDescription>
                                                <p className="text-sm">
                                                    {safeFormatDate(basket.expected_return_date, "MMM d, yyyy", "-")}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    {basket.actual_return_date && (
                                        <div>
                                            <CardDescription className="mb-1">Actual Return</CardDescription>
                                            <p className="text-sm font-medium">
                                                {safeFormatDate(basket.actual_return_date, "MMM d, yyyy", "-")}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <CardDescription className="mb-1 flex items-center gap-2">
                                            <Package className="h-4 w-4" />
                                            Equipment Items
                                        </CardDescription>
                                        <p className="font-medium">
                                            {basket.booking_equipment?.length || 0} items
                                        </p>
                                    </div>
                                    <div className="pt-2">
                                        <Link href={`/dashboard/baskets/${basket.id}`}>
                                            <Button variant="outline" className="w-full">
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Details
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
