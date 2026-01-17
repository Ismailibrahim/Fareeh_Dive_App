"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { diveLogService, DiveLog } from "@/lib/api/services/dive-log.service";
import { customerCertificationService, CustomerCertification } from "@/lib/api/services/customer-certification.service";
import { User, MapPin, Ship, Clock, Calendar, Gauge, Waves, Wind, FileText, Edit, Trash2, Mail, Phone, Award, ArrowLeft } from "lucide-react";
import { safeFormatDate } from "@/lib/utils/date-format";
import Link from "next/link";

export default function DiveLogDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [diveLog, setDiveLog] = useState<DiveLog | null>(null);
    const [certifications, setCertifications] = useState<CustomerCertification[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (params.id) {
            loadDiveLog();
        }
    }, [params.id]);

    const loadDiveLog = async () => {
        const id = params.id as string;
        if (!id) return;
        setLoading(true);
        try {
            const data = await diveLogService.getById(id);
            setDiveLog(data);
            
            // Load customer certifications if customer exists
            if (data.customer_id) {
                try {
                    const certs = await customerCertificationService.getAll(data.customer_id);
                    setCertifications(certs);
                } catch (error) {
                    console.error("Failed to load certifications", error);
                }
            }
        } catch (error) {
            console.error("Failed to load dive log", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!diveLog || !confirm("Are you sure you want to delete this dive log?")) return;
        
        setDeleting(true);
        try {
            await diveLogService.delete(diveLog.id);
            router.push("/dashboard/dive-logs");
            router.refresh();
        } catch (error) {
            console.error("Failed to delete dive log", error);
            alert("Failed to delete dive log. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header title="Dive Log Details" />
                <div className="flex-1 p-8 pt-6">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!diveLog) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header title="Dive Log Details" />
                <div className="flex-1 p-8 pt-6">
                    <p>Dive log not found</p>
                </div>
            </div>
        );
    }

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
            <Header title="Dive Log Details" />
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/dive-logs">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <h2 className="text-2xl font-bold tracking-tight">Dive Log Details</h2>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/dashboard/dive-logs/${diveLog.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deleting ? "Deleting..." : "Delete"}
                        </Button>
                    </div>
                </div>

                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            Basic Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3">
                        {/* Column 1: Customer Information */}
                        <div className="space-y-4">
                            <div>
                                <CardDescription className="text-xs">Customer</CardDescription>
                                <p className="font-medium text-sm">{diveLog.customer?.full_name || 'Unknown'}</p>
                            </div>
                            <div>
                                <CardDescription className="text-xs">Gender</CardDescription>
                                <p className="font-medium text-sm">{diveLog.customer?.gender || 'N/A'}</p>
                            </div>
                            <div>
                                <CardDescription className="text-xs">Date of Birth</CardDescription>
                                <p className="font-medium text-sm">
                                    {diveLog.customer?.date_of_birth 
                                        ? safeFormatDate(diveLog.customer.date_of_birth, "MMMM d, yyyy", "N/A")
                                        : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <CardDescription className="flex items-center gap-2 text-xs">
                                    <Mail className="h-3 w-3" />
                                    Email
                                </CardDescription>
                                <p className="font-medium text-sm">{diveLog.customer?.email || 'N/A'}</p>
                            </div>
                            <div>
                                <CardDescription className="flex items-center gap-2 text-xs">
                                    <Phone className="h-3 w-3" />
                                    Phone
                                </CardDescription>
                                <p className="font-medium text-sm">{diveLog.customer?.phone || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Column 2: Dive Information */}
                        <div className="space-y-4">
                            <div>
                                <CardDescription className="text-xs">Dive Site</CardDescription>
                                <p className="font-medium text-sm">{diveLog.dive_site?.name || 'Unknown'}</p>
                            </div>
                            <div>
                                <CardDescription className="text-xs">Date of Dive</CardDescription>
                                <p className="font-medium text-sm">
                                    {safeFormatDate(diveLog.dive_date, "MMMM d, yyyy", "-")}
                                </p>
                            </div>
                            <div>
                                <CardDescription className="text-xs">Entry / Exit Time</CardDescription>
                                <p className="font-medium text-sm">
                                    {diveLog.entry_time && diveLog.exit_time 
                                        ? `${diveLog.entry_time} / ${diveLog.exit_time}`
                                        : '-'}
                                </p>
                            </div>
                            <div>
                                <CardDescription className="text-xs">Total Dive Time</CardDescription>
                                <p className="font-medium text-sm">
                                    {diveLog.total_dive_time ? `${diveLog.total_dive_time} minutes` : '-'}
                                </p>
                            </div>
                        </div>

                        {/* Column 3: Certification Information */}
                        <div className="space-y-4">
                            {certifications.length > 0 ? (
                                <>
                                    <div>
                                        <CardDescription className="flex items-center gap-2 text-xs">
                                            <Award className="h-3 w-3" />
                                            Certification
                                        </CardDescription>
                                        <p className="font-medium text-sm">{certifications[0].certification_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <CardDescription className="text-xs">Agency</CardDescription>
                                        <p className="font-medium text-sm">{certifications[0].agency || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <CardDescription className="text-xs">Certification Number</CardDescription>
                                        <p className="font-medium text-sm">{certifications[0].certification_no || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <CardDescription className="text-xs">Date Certified</CardDescription>
                                        <p className="font-medium text-sm">
                                            {certifications[0].certification_date 
                                                ? safeFormatDate(certifications[0].certification_date, "MMMM d, yyyy", "N/A")
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <CardDescription className="flex items-center gap-2 text-xs">
                                            <Award className="h-3 w-3" />
                                            Certification
                                        </CardDescription>
                                        <p className="font-medium text-sm text-muted-foreground">N/A</p>
                                    </div>
                                    <div>
                                        <CardDescription className="text-xs">Agency</CardDescription>
                                        <p className="font-medium text-sm text-muted-foreground">N/A</p>
                                    </div>
                                    <div>
                                        <CardDescription className="text-xs">Certification Number</CardDescription>
                                        <p className="font-medium text-sm text-muted-foreground">N/A</p>
                                    </div>
                                    <div>
                                        <CardDescription className="text-xs">Date Certified</CardDescription>
                                        <p className="font-medium text-sm text-muted-foreground">N/A</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Dive Details, Conditions, and Equipment */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Dive Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Gauge className="h-4 w-4 text-primary" />
                                Dive Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div>
                                <CardDescription className="text-xs">Max Depth</CardDescription>
                                <p className="font-medium text-sm">{diveLog.max_depth}m</p>
                            </div>
                            <div>
                                <CardDescription className="text-xs">Boat</CardDescription>
                                <p className="font-medium text-sm">{diveLog.boat?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <CardDescription className="text-xs">Dive Type</CardDescription>
                                <Badge className={getDiveTypeColor(diveLog.dive_type)}>
                                    {diveLog.dive_type}
                                </Badge>
                            </div>
                            <div>
                                <CardDescription className="text-xs">Instructor</CardDescription>
                                <p className="font-medium text-sm">{diveLog.instructor?.full_name || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Conditions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Waves className="h-4 w-4 text-primary" />
                                Conditions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {diveLog.visibility ? (
                                <div>
                                    <CardDescription className="text-xs">Visibility</CardDescription>
                                    <p className="font-medium text-sm">
                                        {diveLog.visibility} {diveLog.visibility_unit}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <CardDescription className="text-xs">Visibility</CardDescription>
                                    <p className="font-medium text-sm text-muted-foreground">N/A</p>
                                </div>
                            )}
                            {diveLog.current ? (
                                <div>
                                    <CardDescription className="text-xs">Current</CardDescription>
                                    <p className="font-medium text-sm">
                                        {diveLog.current} {diveLog.current_unit}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <CardDescription className="text-xs">Current</CardDescription>
                                    <p className="font-medium text-sm text-muted-foreground">N/A</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Equipment */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Gauge className="h-4 w-4 text-primary" />
                                Equipment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {diveLog.tank_size ? (
                                <div>
                                    <CardDescription className="text-xs">Tank Size</CardDescription>
                                    <p className="font-medium text-sm">
                                        {diveLog.tank_size} {diveLog.tank_size_unit}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <CardDescription className="text-xs">Tank Size</CardDescription>
                                    <p className="font-medium text-sm text-muted-foreground">N/A</p>
                                </div>
                            )}
                            <div>
                                <CardDescription className="text-xs">Gas Mix</CardDescription>
                                <Badge className={getGasMixColor(diveLog.gas_mix)}>
                                    {diveLog.gas_mix}
                                </Badge>
                            </div>
                            {diveLog.starting_pressure ? (
                                <div>
                                    <CardDescription className="text-xs">Starting Pressure</CardDescription>
                                    <p className="font-medium text-sm">
                                        {diveLog.starting_pressure} {diveLog.pressure_unit}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <CardDescription className="text-xs">Starting Pressure</CardDescription>
                                    <p className="font-medium text-sm text-muted-foreground">N/A</p>
                                </div>
                            )}
                            {diveLog.ending_pressure ? (
                                <div>
                                    <CardDescription className="text-xs">Ending Pressure</CardDescription>
                                    <p className="font-medium text-sm">
                                        {diveLog.ending_pressure} {diveLog.pressure_unit}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <CardDescription className="text-xs">Ending Pressure</CardDescription>
                                    <p className="font-medium text-sm text-muted-foreground">N/A</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Notes */}
                {diveLog.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap text-sm">{diveLog.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}


