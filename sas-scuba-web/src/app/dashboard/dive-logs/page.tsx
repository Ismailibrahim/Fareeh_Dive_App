"use client";

import { useState, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DiveLog } from "@/lib/api/services/dive-log.service";
import { useDiveLogs } from "@/lib/hooks/use-dive-logs";
import { Plus, Search, MoreHorizontal, Eye, Calendar, Gauge, Waves } from "lucide-react";
import Link from "next/link";
import { safeFormatDate } from "@/lib/utils/date-format";

export default function DiveLogsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    // Debounce search term (500ms delay)
    const debouncedSearch = useDebouncedCallback((value: string) => {
        setDebouncedSearchTerm(value);
        setCurrentPage(1); // Reset to first page on new search
    }, 500);

    // Fetch dive logs using React Query
    const { data: diveLogsData, isLoading, error } = useDiveLogs({
        page: currentPage,
        per_page: 20,
        search: debouncedSearchTerm || undefined,
    });

    // Extract dive logs and pagination from response
    const diveLogs = useMemo(() => {
        if (!diveLogsData) return [];
        return diveLogsData.data || [];
    }, [diveLogsData]);

    const pagination = useMemo(() => {
        if (!diveLogsData) {
            return {
                total: 0,
                per_page: 20,
                last_page: 1,
                current_page: 1,
            };
        }
        return {
            total: diveLogsData.total || 0,
            per_page: diveLogsData.per_page || 20,
            last_page: diveLogsData.last_page || 1,
            current_page: diveLogsData.current_page || currentPage,
        };
    }, [diveLogsData, currentPage]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        debouncedSearch(value);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const getDiveTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            'Recreational': 'bg-blue-100 text-blue-800',
            'Training': 'bg-green-100 text-green-800',
            'Technical': 'bg-purple-100 text-purple-800',
            'Night': 'bg-gray-100 text-gray-800',
            'Wreck': 'bg-orange-100 text-orange-800',
            'Cave': 'bg-red-100 text-red-800',
            'Drift': 'bg-cyan-100 text-cyan-800',
            'Other': 'bg-yellow-100 text-yellow-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    const getGasMixColor = (mix: string) => {
        const colors: Record<string, string> = {
            'Air': 'bg-gray-100 text-gray-800',
            'Nitrox': 'bg-blue-100 text-blue-800',
            'Trimix': 'bg-purple-100 text-purple-800',
        };
        return colors[mix] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Dive Logs" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Dive Logs</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/dive-logs/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> New Dive Log
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search dive logs..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-md border hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Dive Site</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Entry/Exit</TableHead>
                                <TableHead>Max Depth</TableHead>
                                <TableHead>Dive Type</TableHead>
                                <TableHead>Gas Mix</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-red-600">
                                        Error loading dive logs. Please try again.
                                    </TableCell>
                                </TableRow>
                            ) : diveLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        No dive logs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                diveLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">
                                            {log.customer?.full_name || 'Unknown Customer'}
                                        </TableCell>
                                        <TableCell>
                                            {log.dive_site?.name || 'Unknown Site'}
                                        </TableCell>
                                        <TableCell>
                                            {log.dive_date ? (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {safeFormatDate(log.dive_date, "MMM d, yyyy", "-")}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {log.entry_time && log.exit_time ? (
                                                <span className="text-sm">
                                                    {log.entry_time} / {log.exit_time}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Gauge className="h-4 w-4 text-muted-foreground" />
                                                {log.max_depth}m
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getDiveTypeColor(log.dive_type)}>
                                                {log.dive_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getGasMixColor(log.gas_mix)}>
                                                {log.gas_mix}
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
                                                        <Link href={`/dashboard/dive-logs/${log.id}`}>
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

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="flex justify-center">
                        <Pagination
                            currentPage={pagination.current_page}
                            totalPages={pagination.last_page}
                            onPageChange={handlePageChange}
                            itemsPerPage={pagination.per_page}
                            totalItems={pagination.total}
                        />
                    </div>
                )}

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {isLoading ? (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">Loading...</p>
                            </CardContent>
                        </Card>
                    ) : error ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <p className="text-red-600">Error loading dive logs. Please try again.</p>
                            </CardContent>
                        </Card>
                    ) : diveLogs.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <Waves className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No dive logs found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        diveLogs.map((log) => (
                            <Card key={log.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2 flex-1">
                                            <Link
                                                href={`/dashboard/dive-logs/${log.id}`}
                                                className="font-semibold text-lg hover:underline"
                                            >
                                                {log.customer?.full_name || 'Unknown Customer'}
                                            </Link>
                                            <p className="text-sm text-muted-foreground">
                                                {log.dive_site?.name || 'Unknown Site'}
                                            </p>
                                            <div className="flex gap-2">
                                                <Badge className={getDiveTypeColor(log.dive_type)}>
                                                    {log.dive_type}
                                                </Badge>
                                                <Badge className={getGasMixColor(log.gas_mix)}>
                                                    {log.gas_mix}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {log.dive_date && (
                                        <div>
                                            <CardDescription className="mb-1">Date</CardDescription>
                                            <p className="text-sm">
                                                {safeFormatDate(log.dive_date, "MMM d, yyyy", "-")}
                                            </p>
                                        </div>
                                    )}
                                    {log.entry_time && log.exit_time && (
                                        <div>
                                            <CardDescription className="mb-1">Entry/Exit Time</CardDescription>
                                            <p className="text-sm">
                                                {log.entry_time} / {log.exit_time}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <CardDescription className="mb-1 flex items-center gap-2">
                                            <Gauge className="h-4 w-4" />
                                            Max Depth
                                        </CardDescription>
                                        <p className="font-medium">{log.max_depth}m</p>
                                    </div>
                                    <div className="pt-2">
                                        <Link href={`/dashboard/dive-logs/${log.id}`}>
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


