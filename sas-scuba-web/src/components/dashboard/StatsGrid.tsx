import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { DollarSign, Users, Calendar, Activity } from "lucide-react";
import { dashboardService, DashboardStats } from "@/lib/api/services/dashboard.service";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsGrid() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const data = await dashboardService.getStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    const statItems = [
        {
            title: "Total Revenue",
            value: stats ? `$${stats.revenue.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "$0.00",
            description: stats ? `${stats.revenue.growth >= 0 ? '+' : ''}${stats.revenue.growth}% from last month` : "No data",
            icon: DollarSign,
            className: "text-emerald-500",
        },
        {
            title: "Active Bookings",
            value: stats ? `+${stats.bookings.active}` : "0",
            description: stats ? `+${stats.bookings.new_last_hour} since last hour` : "No data",
            icon: Calendar,
            className: "text-blue-500",
        },
        {
            title: "Active Customers",
            value: stats ? `+${stats.customers.total}` : "0",
            description: stats ? `+${stats.customers.new_this_month} new this month` : "No data",
            icon: Users,
            className: "text-orange-500",
        },
        {
            title: "Dives Today",
            value: stats ? `+${stats.dives.today}` : "0",
            description: stats ? `+${stats.dives.new_last_hour} since last hour` : "No data",
            icon: Activity,
            className: "text-purple-500",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statItems.map((stat, index) => (
                <Card key={index} className="border-l-4 border-l-primary/10 hover:border-l-primary transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {stat.title}
                        </CardTitle>
                        <stat.icon className={`h-4 w-4 ${stat.className}`} />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-7 w-24" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stat.description}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
