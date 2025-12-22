"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2, Edit, Mail, Phone, DollarSign, CreditCard, FileText, Tag as TagIcon, TrendingUp, Users, Calendar } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { agentService, Agent } from "@/lib/api/services/agent.service";
import { Badge } from "@/components/ui/badge";
import { agentReportService } from "@/lib/api/services/agent-report.service";
import { safeFormatDate } from "@/lib/utils/date-format";

export default function AgentDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [agent, setAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);
    const [performance, setPerformance] = useState<any>(null);

    useEffect(() => {
        if (!id) return;
        const fetchAgent = async () => {
            try {
                const data = await agentService.getById(id);
                setAgent(data);
                
                // Fetch performance metrics
                const perf = await agentService.getPerformance(id);
                setPerformance(perf.metrics);
            } catch (error) {
                console.error("Failed to fetch agent", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAgent();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Agent Details" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
                <Header title="Agent Details" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-muted-foreground">Agent not found</p>
                        <Link href="/dashboard/agents">
                            <Button variant="outline" className="mt-4">
                                Back to Agents
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Agent Details" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/agents">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                                <span className="sr-only">Back</span>
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">{agent.agent_name}</h2>
                            <p className="text-muted-foreground">Agent information and performance metrics.</p>
                        </div>
                    </div>
                    <Link href={`/dashboard/agents/${id}/edit`}>
                        <Button>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Agent
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Agent Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                Agent Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Agent Type</p>
                                <Badge variant="outline">{agent.agent_type}</Badge>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Location</p>
                                <p className="font-medium">{agent.city}, {agent.country}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge variant={agent.status === 'Active' ? 'default' : 'secondary'}>
                                    {agent.status}
                                </Badge>
                            </div>
                            {agent.brand_name && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Brand Name</p>
                                    <p className="font-medium">{agent.brand_name}</p>
                                </div>
                            )}
                            {agent.website && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Website</p>
                                    <a href={agent.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                        {agent.website}
                                    </a>
                                </div>
                            )}
                            {agent.notes && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Notes</p>
                                    <p className="text-sm">{agent.notes}</p>
                                </div>
                            )}
                            {agent.tags && agent.tags.length > 0 && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Tags</p>
                                    <div className="flex flex-wrap gap-2">
                                        {agent.tags.map((tag) => (
                                            <Badge key={tag.id} variant="outline" style={tag.color ? { borderColor: tag.color } : {}}>
                                                {tag.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contact Details */}
                    {agent.contacts?.[0] && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Mail className="h-5 w-5 text-primary" />
                                    Contact Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Contact Person</p>
                                    <p className="font-medium">{agent.contacts[0].contact_person_name}</p>
                                    {agent.contacts[0].job_title && (
                                        <p className="text-sm text-muted-foreground">{agent.contacts[0].job_title}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{agent.contacts[0].email}</p>
                                </div>
                                {agent.contacts[0].phone && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Phone</p>
                                        <p className="font-medium">{agent.contacts[0].phone}</p>
                                    </div>
                                )}
                                {agent.contacts[0].preferred_communication_method && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Preferred Communication</p>
                                        <p className="font-medium">{agent.contacts[0].preferred_communication_method}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Performance Metrics */}
                    {performance && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    Performance Metrics
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Clients</p>
                                        <p className="text-2xl font-bold">{performance.total_clients_referred || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Dives</p>
                                        <p className="text-2xl font-bold">{performance.total_dives_booked || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                                        <p className="text-2xl font-bold">${(performance.total_revenue_generated || 0).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Commission Earned</p>
                                        <p className="text-2xl font-bold">${(performance.total_commission_earned || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Avg Revenue per Client</p>
                                    <p className="text-xl font-semibold">${(performance.average_revenue_per_client || 0).toFixed(2)}</p>
                                </div>
                                {performance.last_booking_date && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Last Booking</p>
                                        <p className="font-medium">{safeFormatDate(performance.last_booking_date, "MMM d, yyyy", "N/A")}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Active (30 days)</p>
                                        <p className="font-medium">{performance.active_clients_last_30_days || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Active (90 days)</p>
                                        <p className="font-medium">{performance.active_clients_last_90_days || 0}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Commercial Terms */}
                    {agent.commercial_terms && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    Commercial Terms
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Commission Type</p>
                                    <p className="font-medium">{agent.commercial_terms.commission_type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Commission Rate</p>
                                    <p className="font-medium">
                                        {agent.commercial_terms.commission_type === 'Percentage' 
                                            ? `${agent.commercial_terms.commission_rate}%`
                                            : `${agent.commercial_terms.currency} ${agent.commercial_terms.commission_rate}`
                                        }
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Payment Terms</p>
                                    <p className="font-medium">{agent.commercial_terms.payment_terms}</p>
                                </div>
                                {agent.commercial_terms.vat_applicable && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">VAT/GST</p>
                                        <Badge>Applicable</Badge>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Contract Details */}
                    {agent.contract && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Contract Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {agent.contract.contract_start_date && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Start Date</p>
                                        <p className="font-medium">{safeFormatDate(agent.contract.contract_start_date, "MMM d, yyyy", "N/A")}</p>
                                    </div>
                                )}
                                {agent.contract.contract_end_date && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">End Date</p>
                                        <p className="font-medium">{safeFormatDate(agent.contract.contract_end_date, "MMM d, yyyy", "N/A")}</p>
                                    </div>
                                )}
                                {agent.contract.signed_agreement_url && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Signed Agreement</p>
                                        <a href={agent.contract.signed_agreement_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            View Document
                                        </a>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="flex gap-4">
                    <Link href={`/dashboard/agents/${id}/reports`}>
                        <Button variant="outline">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            View Reports
                        </Button>
                    </Link>
                    <Link href={`/dashboard/agents/${id}/edit`}>
                        <Button>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Agent
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

