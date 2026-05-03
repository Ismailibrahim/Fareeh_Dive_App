import apiClient from '../client';

export interface DashboardStats {
    revenue: {
        total: number;
        this_month: number;
        growth: number;
    };
    bookings: {
        active: number;
        new_last_hour: number;
    };
    customers: {
        total: number;
        new_this_month: number;
    };
    dives: {
        today: number;
        new_last_hour: number;
    };
}

export const dashboardService = {
    async getStats(): Promise<DashboardStats> {
        const response = await apiClient.get('/api/v1/dashboard/stats');
        return response.data;
    },
};
