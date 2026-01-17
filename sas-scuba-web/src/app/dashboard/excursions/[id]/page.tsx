"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Clock, Users, Calendar } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { excursionService, Excursion } from "@/lib/api/services/excursion.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExcursionDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [excursion, setExcursion] = useState<Excursion | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchExcursion = async () => {
            try {
                const data = await excursionService.getById(id);
                setExcursion(data);
            } catch (error) {
                console.error("Failed to fetch excursion", error);
            } finally {
                setLoading(false);
            }
        };
        fetchExcursion();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Excursion Details" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            </div>
        );
    }

    if (!excursion) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Excursion Details" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-muted-foreground">Excursion not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Excursion Details" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/excursions">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold tracking-tight">{excursion.name}</h2>
                        <p className="text-muted-foreground">View excursion details</p>
                    </div>
                    <Link href={`/dashboard/excursions/${id}/edit`}>
                        <Button>Edit</Button>
                    </Link>
                </div>

                <div className="mx-auto max-w-3xl space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Excursion Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <CardDescription>Name</CardDescription>
                                <p className="font-medium">{excursion.name}</p>
                            </div>
                            {excursion.description && (
                                <div>
                                    <CardDescription>Description</CardDescription>
                                    <p className="text-sm whitespace-pre-wrap">{excursion.description}</p>
                                </div>
                            )}
                            {excursion.location && (
                                <div>
                                    <CardDescription className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Location
                                    </CardDescription>
                                    <p>{excursion.location}</p>
                                </div>
                            )}
                            {excursion.duration && (
                                <div>
                                    <CardDescription className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Duration
                                    </CardDescription>
                                    <p>{excursion.duration} minutes</p>
                                </div>
                            )}
                            {excursion.capacity && (
                                <div>
                                    <CardDescription className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Capacity
                                    </CardDescription>
                                    <p>{excursion.capacity} people</p>
                                </div>
                            )}
                            {excursion.meeting_point && (
                                <div>
                                    <CardDescription>Meeting Point</CardDescription>
                                    <p>{excursion.meeting_point}</p>
                                </div>
                            )}
                            {excursion.departure_time && (
                                <div>
                                    <CardDescription className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Departure Time
                                    </CardDescription>
                                    <p>{excursion.departure_time}</p>
                                </div>
                            )}
                            <div>
                                <CardDescription>Status</CardDescription>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    excursion.is_active 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                }`}>
                                    {excursion.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
