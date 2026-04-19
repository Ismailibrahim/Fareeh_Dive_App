"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Boat, boatService } from "@/lib/api/services/boat.service";
import { DiveSite, diveSiteService } from "@/lib/api/services/dive-site.service";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Ship, MapPin, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

export default function AssetsPage() {
    const [boats, setBoats] = useState<Boat[]>([]);
    const [diveSites, setDiveSites] = useState<DiveSite[]>([]);
    const [boatsLoading, setBoatsLoading] = useState(true);
    const [diveSitesLoading, setDiveSitesLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"boats" | "sites">("boats");

    const fetchBoats = async () => {
        setBoatsLoading(true);
        try {
            const data = await boatService.getAll();
            const boatsList = Array.isArray(data) ? data : (data as any).data || [];
            setBoats(boatsList);
        } catch (error) {
            console.error("Failed to fetch boats", error);
        } finally {
            setBoatsLoading(false);
        }
    };

    const fetchDiveSites = async () => {
        setDiveSitesLoading(true);
        try {
            const data = await diveSiteService.getAll();
            const diveSitesList = Array.isArray(data) ? data : (data as any).data || [];
            setDiveSites(diveSitesList);
        } catch (error) {
            console.error("Failed to fetch dive sites", error);
        } finally {
            setDiveSitesLoading(false);
        }
    };

    useEffect(() => {
        fetchBoats();
        fetchDiveSites();
    }, []);

    // Refresh data when page comes into focus
    useEffect(() => {
        const handleFocus = () => {
            fetchBoats();
            fetchDiveSites();
        };
        
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const filteredBoats = boats.filter(boat =>
        boat.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredDiveSites = diveSites.filter(diveSite =>
        diveSite.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        diveSite.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        diveSite.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeBoats = boats.filter(b => b.active).length;
    const activeDiveSites = diveSites.length; // Assuming all dive sites are active

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Sites & Boats" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Assets</h2>
                        <p className="text-muted-foreground">
                            Manage your boats and dive sites
                        </p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Boats</CardTitle>
                            <Ship className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{boats.length}</div>
                            <p className="text-xs text-muted-foreground">
                                {activeBoats} active
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Dive Sites</CardTitle>
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{diveSites.length}</div>
                            <p className="text-xs text-muted-foreground">
                                {activeDiveSites} active
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {boats.reduce((sum, b) => sum + (b.capacity || 0), 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Boat capacity
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{boats.length + diveSites.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Combined total
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/boats/create">
                        <Button variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Boat
                        </Button>
                    </Link>
                    <Link href="/dashboard/dive-sites/create">
                        <Button variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Dive Site
                        </Button>
                    </Link>
                    <Link href="/dashboard/boats">
                        <Button variant="outline">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Manage Boats
                        </Button>
                    </Link>
                    <Link href="/dashboard/dive-sites">
                        <Button variant="outline">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Manage Dive Sites
                        </Button>
                    </Link>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search boats and dive sites..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tabs for Boats and Dive Sites */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "boats" | "sites")} className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="boats">
                            <Ship className="mr-2 h-4 w-4" />
                            Boats ({boats.length})
                        </TabsTrigger>
                        <TabsTrigger value="sites">
                            <MapPin className="mr-2 h-4 w-4" />
                            Dive Sites ({diveSites.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="boats" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Boats</CardTitle>
                                <CardDescription>
                                    {filteredBoats.length} of {boats.length} boats
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Capacity</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Ownership</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {boatsLoading ? (
                                                Array.from({ length: 5 }).map((_, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                        <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : filteredBoats.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                        No boats found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredBoats.map((boat) => (
                                                    <TableRow key={boat.id}>
                                                        <TableCell className="font-medium">
                                                            {boat.name}
                                                        </TableCell>
                                                        <TableCell>
                                                            {boat.capacity || 'N/A'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={boat.active ? "default" : "secondary"}>
                                                                {boat.active ? "Active" : "Inactive"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={boat.is_owned ? "default" : "outline"}>
                                                                {boat.is_owned ? "Owned" : "Rented"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Link href={`/dashboard/boats/${boat.id}/edit`}>
                                                                <Button variant="ghost" size="sm">
                                                                    View
                                                                </Button>
                                                            </Link>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="sites" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Dive Sites</CardTitle>
                                <CardDescription>
                                    {filteredDiveSites.length} of {diveSites.length} dive sites
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Location</TableHead>
                                                <TableHead>Max Depth</TableHead>
                                                <TableHead>Capacity</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {diveSitesLoading ? (
                                                Array.from({ length: 5 }).map((_, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                        <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : filteredDiveSites.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                        No dive sites found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredDiveSites.map((diveSite) => (
                                                    <TableRow key={diveSite.id}>
                                                        <TableCell className="font-medium">
                                                            {diveSite.name}
                                                        </TableCell>
                                                        <TableCell>
                                                            {diveSite.location || 'N/A'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {diveSite.max_depth ? `${diveSite.max_depth}m` : 'N/A'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {diveSite.pax_capacity || 'N/A'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Link href={`/dashboard/dive-sites/${diveSite.id}/edit`}>
                                                                <Button variant="ghost" size="sm">
                                                                    View
                                                                </Button>
                                                            </Link>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
