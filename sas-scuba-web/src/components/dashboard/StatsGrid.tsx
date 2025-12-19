import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { DollarSign, Users, Calendar, Activity } from "lucide-react";

const stats = [
    {
        title: "Total Revenue",
        value: "$45,231.89",
        description: "+20.1% from last month",
        icon: DollarSign,
        className: "text-emerald-500",
    },
    {
        title: "Active Bookings",
        value: "+573",
        description: "+201 since last hour",
        icon: Calendar,
        className: "text-blue-500",
    },
    {
        title: "Active Customers",
        value: "+2350",
        description: "+180 new customers",
        icon: Users,
        className: "text-orange-500",
    },
    {
        title: "Dives Today",
        value: "+12",
        description: "+9 since last hour",
        icon: Activity,
        className: "text-purple-500",
    },
];

export function StatsGrid() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <Card key={index} className="border-l-4" style={{ borderLeftColor: 'var(--border)' }}> {/* Simplified border logic, can be enhanced */}
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {stat.title}
                        </CardTitle>
                        <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.className}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">
                            {stat.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
