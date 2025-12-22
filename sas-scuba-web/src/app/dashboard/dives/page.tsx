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
import { bookingDiveService, BookingDive } from "@/lib/api/services/booking-dive.service";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreHorizontal, Eye, Calendar, Waves, Ship, Clock, Gauge } from "lucide-react";
import Link from "next/link";
import { safeFormatDate } from "@/lib/utils/date-format";

export default function DivesPage() {
    const router = useRouter();
    const [dives, setDives] = useState<BookingDive[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadDives();
    }, []);

    // Refresh data when page comes into focus
    useEffect(() => {
        const handleFocus = () => {
            loadDives();
        };
        
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const loadDives = async () => {
        setLoading(true);
        try {
            const data = await bookingDiveService.getAll(1);
            const diveList = Array.isArray(data) ? data : (data as any).data || [];
            setDives(diveList);
        } catch (error) {
            console.error("Failed to load dives", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-100 text-green-800';
            case 'In Progress':
                return 'bg-blue-100 text-blue-800';
            case 'Scheduled':
                return 'bg-yellow-100 text-yellow-800';
            case 'Cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusVariant = (status?: string) => {
        switch (status) {
            case 'Completed':
                return 'default';
            case 'In Progress':
                return 'secondary';
            case 'Scheduled':
                return 'outline';
            case 'Cancelled':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const filteredDives = dives.filter(dive => {
        // Search filter
        const matchesSearch = 
            dive.dive_site?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dive.booking?.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dive.booking?.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dive.boat?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
    });

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Dives" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Dives</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/dives/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> New Dive
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search dives..."
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
                                <TableHead>Dive Site</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Dive Date</TableHead>
                                <TableHead>Dive Time</TableHead>
                                <TableHead>Boat</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Max Depth</TableHead>
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
                            ) : filteredDives.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center">
                                        No dives found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredDives.map((dive) => (
                                    <TableRow key={dive.id}>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={`/dashboard/dives/${dive.id}`}
                                                className="hover:underline flex items-center gap-2"
                                            >
                                                <Waves className="h-4 w-4 text-muted-foreground" />
                                                {dive.dive_site?.name || 'Unknown Site'}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            {dive.booking?.customer?.full_name || 'Unknown Customer'}
                                        </TableCell>
                                        <TableCell>
                                            {dive.dive_date ? (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {safeFormatDate(dive.dive_date, "MMM d, yyyy", "-")}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {dive.dive_time ? (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    {dive.dive_time}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {dive.boat?.name ? (
                                                <div className="flex items-center gap-2">
                                                    <Ship className="h-4 w-4 text-muted-foreground" />
                                                    {dive.boat.name}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {dive.dive_duration ? (
                                                <span>{dive.dive_duration} min</span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {dive.max_depth ? (
                                                <div className="flex items-center gap-2">
                                                    <Gauge className="h-4 w-4 text-muted-foreground" />
                                                    {dive.max_depth}m
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(dive.status)}>
                                                {dive.status || 'Scheduled'}
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
                                                        <Link href={`/dashboard/dives/${dive.id}`}>
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
                    ) : filteredDives.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <Waves className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No dives found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredDives.map((dive) => (
                            <Card key={dive.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2 flex-1">
                                            <Link
                                                href={`/dashboard/dives/${dive.id}`}
                                                className="font-semibold text-lg hover:underline flex items-center gap-2"
                                            >
                                                <Waves className="h-5 w-5 text-muted-foreground" />
                                                {dive.dive_site?.name || 'Unknown Site'}
                                            </Link>
                                            <Badge variant={getStatusVariant(dive.status)} className="w-fit">
                                                {dive.status || 'Scheduled'}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <CardDescription className="mb-1">Customer</CardDescription>
                                        <p className="font-medium">
                                            {dive.booking?.customer?.full_name || 'Unknown Customer'}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {dive.dive_date && (
                                            <div>
                                                <CardDescription className="mb-1 flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    Dive Date
                                                </CardDescription>
                                                <p className="text-sm">
                                                    {safeFormatDate(dive.dive_date, "MMM d, yyyy", "-")}
                                                </p>
                                            </div>
                                        )}
                                        {dive.dive_time && (
                                            <div>
                                                <CardDescription className="mb-1 flex items-center gap-2">
                                                    <Clock className="h-4 w-4" />
                                                    Time
                                                </CardDescription>
                                                <p className="text-sm">{dive.dive_time}</p>
                                            </div>
                                        )}
                                    </div>
                                    {dive.boat?.name && (
                                        <div>
                                            <CardDescription className="mb-1 flex items-center gap-2">
                                                <Ship className="h-4 w-4" />
                                                Boat
                                            </CardDescription>
                                            <p className="text-sm font-medium">{dive.boat.name}</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        {dive.dive_duration && (
                                            <div>
                                                <CardDescription className="mb-1">Duration</CardDescription>
                                                <p className="text-sm font-medium">{dive.dive_duration} min</p>
                                            </div>
                                        )}
                                        {dive.max_depth && (
                                            <div>
                                                <CardDescription className="mb-1 flex items-center gap-2">
                                                    <Gauge className="h-4 w-4" />
                                                    Max Depth
                                                </CardDescription>
                                                <p className="text-sm font-medium">{dive.max_depth}m</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-2">
                                        <Link href={`/dashboard/dives/${dive.id}`}>
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

