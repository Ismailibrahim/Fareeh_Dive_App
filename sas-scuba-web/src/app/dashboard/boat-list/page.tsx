"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BoatListAccordion } from "@/components/boat-list/BoatListAccordion";
import { boatListService, BoatListSession, BoatListFilters } from "@/lib/api/services/boat-list.service";
import { boatService, Boat } from "@/lib/api/services/boat.service";
import { diveSiteService, DiveSite } from "@/lib/api/services/dive-site.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Filter, RefreshCw } from "lucide-react";

export default function BoatListPage() {
    const [sessions, setSessions] = useState<BoatListSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [boats, setBoats] = useState<Boat[]>([]);
    const [diveSites, setDiveSites] = useState<DiveSite[]>([]);
    
    const [filters, setFilters] = useState<BoatListFilters>({
        date_from: new Date().toISOString().split('T')[0], // Today by default
    });

    const fetchBoatList = async () => {
        setLoading(true);
        try {
            const data = await boatListService.getBoatList(filters);
            setSessions(data);
        } catch (error) {
            console.error("Failed to fetch boat list", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBoats = async () => {
        try {
            const response = await boatService.getAll(1, true); // Get active boats only
            const boatsList = Array.isArray(response.data) ? response.data : (response as any).data || [];
            setBoats(boatsList);
        } catch (error) {
            console.error("Failed to fetch boats", error);
        }
    };

    const fetchDiveSites = async () => {
        try {
            const response = await diveSiteService.getAll(1);
            const sitesList = Array.isArray(response.data) ? response.data : (response as any).data || [];
            setDiveSites(sitesList);
        } catch (error) {
            console.error("Failed to fetch dive sites", error);
        }
    };

    useEffect(() => {
        fetchBoats();
        fetchDiveSites();
    }, []);

    useEffect(() => {
        fetchBoatList();
    }, [filters]);

    const handleFilterChange = (key: keyof BoatListFilters, value: string | number | undefined) => {
        setFilters(prev => ({
            ...prev,
            [key]: value || undefined,
        }));
    };

    const clearFilters = () => {
        setFilters({
            date_from: new Date().toISOString().split('T')[0],
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Boat List" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Boat List</h2>
                        <p className="text-muted-foreground">
                            View dive sessions grouped by boat, date, time, and dive site
                        </p>
                    </div>
                    <Button onClick={fetchBoatList} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <h3 className="text-sm font-semibold">Filters</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date_from">Date From</Label>
                                <Input
                                    id="date_from"
                                    type="date"
                                    value={filters.date_from || ''}
                                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date_to">Date To</Label>
                                <Input
                                    id="date_to"
                                    type="date"
                                    value={filters.date_to || ''}
                                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="boat">Boat</Label>
                                <Select
                                    value={filters.boat_id?.toString() || 'all'}
                                    onValueChange={(value) => handleFilterChange('boat_id', value === 'all' ? undefined : parseInt(value))}
                                >
                                    <SelectTrigger id="boat">
                                        <SelectValue placeholder="All Boats" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Boats</SelectItem>
                                        {boats.map((boat) => (
                                            <SelectItem key={boat.id} value={boat.id.toString()}>
                                                {boat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dive_site">Dive Site</Label>
                                <Select
                                    value={filters.dive_site_id?.toString() || 'all'}
                                    onValueChange={(value) => handleFilterChange('dive_site_id', value === 'all' ? undefined : parseInt(value))}
                                >
                                    <SelectTrigger id="dive_site">
                                        <SelectValue placeholder="All Dive Sites" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Dive Sites</SelectItem>
                                        {diveSites.map((site) => (
                                            <SelectItem key={site.id} value={site.id.toString()}>
                                                {site.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Button onClick={clearFilters} variant="outline" size="sm">
                                Clear Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Boat List Sessions */}
                {loading ? (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-center text-muted-foreground">Loading boat list...</p>
                        </CardContent>
                    </Card>
                ) : (
                    <BoatListAccordion sessions={sessions} />
                )}
            </div>
        </div>
    );
}

