"use client";

import { Header } from "@/components/layout/Header";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { useEffect, useState } from "react";

export default function DashboardPage() {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Catch any unhandled errors
        const handleError = (event: ErrorEvent) => {
            console.error('Dashboard error:', event.error);
            setError('An error occurred. Please refresh the page.');
        };

        window.addEventListener('error', handleError);
        return () => window.removeEventListener('error', handleError);
    }, []);

    if (error) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header title="Dashboard" />
                <div className="p-8">
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                        <p>{error}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="mt-2 text-sm underline"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Dashboard" />
            <div className="p-8 space-y-8">
                <StatsGrid />

                {/* Recent Activity Section placeholder */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow">
                        <div className="p-6">
                            <h3 className="font-semibold leading-none tracking-tight">Recent Bookings</h3>
                            <p className="text-sm text-muted-foreground">You made 265 sales this month.</p>
                        </div>
                        <div className="p-6 pt-0">
                            {/* Chart or List placeholder */}
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                Chart Placeholder
                            </div>
                        </div>
                    </div>
                    <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow">
                        <div className="p-6">
                            <h3 className="font-semibold leading-none tracking-tight">Recent Activity</h3>
                            <p className="text-sm text-muted-foreground">Latest actions on the platform.</p>
                        </div>
                        <div className="p-6 pt-0">
                            {/* Activity List placeholder */}
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                Activity Feed Placeholder
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
