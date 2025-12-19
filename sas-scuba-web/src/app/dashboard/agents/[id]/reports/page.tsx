"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, DollarSign, Users, Calendar } from "lucide-react";
import Link from "next/link";
import { agentService, Agent } from "@/lib/api/services/agent.service";
import { agentReportService, MonthlyPerformance } from "@/lib/api/services/agent-report.service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AgentReportsPage() {
    const params = useParams();
    const id = params.id as string;
    const [agent, setAgent] = useState<Agent | null>(null);
    const [performance, setPerformance] = useState<any>(null);
    const [monthlyData, setMonthlyData] = useState<MonthlyPerformance | null>(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                const agentData = await agentService.getById(id);
                setAgent(agentData);
                
                const perf = await agentService.getPerformance(id);
                setPerformance(perf.metrics);
                
                const monthly = await agentReportService.getMonthlyPerformance(id, {
                    year: selectedYear,
                    month: selectedMonth,
                });
                setMonthlyData(monthly);
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, selectedYear, selectedMonth]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header title="Agent Reports" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
            <Header title="Agent Reports" />
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/agents/${id}`}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Performance Reports</h2>
                        <p className="text-muted-foreground">{agent?.agent_name}</p>
                    </div>
                </div>

                {performance && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <div className="text-2xl font-bold">{performance.total_clients_referred || 0}</div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <div className="text-2xl font-bold">${(performance.total_revenue_generated || 0).toFixed(2)}</div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Commission Earned</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    <div className="text-2xl font-bold">${(performance.total_commission_earned || 0).toFixed(2)}</div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Avg per Client</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <div className="text-2xl font-bold">${(performance.average_revenue_per_client || 0).toFixed(2)}</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Monthly Performance */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    Monthly Performance
                                </CardTitle>
                                <CardDescription>Detailed breakdown by month</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                            <SelectItem key={month} value={month.toString()}>
                                                {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {monthlyData ? (
                            <div className="grid gap-4 md:grid-cols-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Bookings</p>
                                    <p className="text-2xl font-bold">{monthlyData.bookings_count}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Clients</p>
                                    <p className="text-2xl font-bold">{monthlyData.clients_count}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Revenue</p>
                                    <p className="text-2xl font-bold">${monthlyData.revenue.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Commissions</p>
                                    <p className="text-2xl font-bold">${monthlyData.commissions.toFixed(2)}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No data available for this period.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

