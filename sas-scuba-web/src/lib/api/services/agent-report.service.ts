import apiClient from "../client";
import { Agent } from "./agent.service";

export interface TopPerformer {
    id: number;
    agent_name: string;
    agent_type: string;
    status: string;
    total_clients_referred: number;
    total_revenue_generated: number;
    total_commission_earned: number;
}

export interface CommissionPayable {
    commissions: any[];
    total_amount: number;
    count: number;
}

export interface MonthlyPerformance {
    period: {
        year: number;
        month: number;
        start_date: string;
        end_date: string;
    };
    bookings_count: number;
    clients_count: number;
    revenue: number;
    commissions: number;
    bookings: any[];
}

export interface DormantAgent {
    id: number;
    agent_name: string;
    agent_type: string;
    last_booking_date?: string;
    total_clients_referred: number;
}

export const agentReportService = {
    getTopPerformers: async (params?: { sort_by?: 'revenue' | 'clients' | 'commission'; limit?: number }) => {
        const queryParams = new URLSearchParams();
        if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        
        const response = await apiClient.get<TopPerformer[]>(`/api/v1/reports/agents/top-performers?${queryParams.toString()}`);
        return response.data;
    },

    getCommissionPayable: async () => {
        const response = await apiClient.get<CommissionPayable>("/api/v1/reports/agents/commission-payable");
        return response.data;
    },

    getMonthlyPerformance: async (agentId: string | number, params?: { year?: number; month?: number }) => {
        const queryParams = new URLSearchParams();
        if (params?.year) queryParams.append('year', params.year.toString());
        if (params?.month) queryParams.append('month', params.month.toString());
        
        const response = await apiClient.get<MonthlyPerformance>(`/api/v1/agents/${agentId}/reports/monthly?${queryParams.toString()}`);
        return response.data;
    },

    getDormantAgents: async (days?: number) => {
        const queryParams = new URLSearchParams();
        if (days) queryParams.append('days', days.toString());
        
        const response = await apiClient.get<DormantAgent[]>(`/api/v1/reports/agents/dormant?${queryParams.toString()}`);
        return response.data;
    },
};

