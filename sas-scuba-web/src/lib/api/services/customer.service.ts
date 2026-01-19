import apiClient from "../client";

import { EmergencyContact } from "./emergency-contact.service";

export interface Customer {
    id: number;
    full_name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    zip_code?: string;
    country?: string;
    passport_no?: string;
    nationality?: string;
    gender?: string;
    date_of_birth?: string;
    departure_date?: string;
    departure_flight?: string;
    departure_flight_time?: string;
    departure_to?: string;
    agent_id?: number;
    agent?: {
        id: number;
        agent_name: string;
    };
    emergency_contacts?: EmergencyContact[];
    created_at: string;
}

export interface CustomerFormData {
    full_name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    zip_code?: string;
    country?: string;
    passport_no?: string;
    nationality?: string;
    gender?: string;
    date_of_birth?: string;
    departure_date?: string;
    departure_flight?: string;
    departure_flight_time?: string;
    departure_to?: string;
    agent_id?: number;
}

export interface PaginationParams {
    page?: number;
    per_page?: number;
    search?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
}

export const customerService = {
    getAll: async (params?: PaginationParams) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
        if (params?.search) queryParams.append('search', params.search);
        
        const response = await apiClient.get<PaginatedResponse<Customer>>(`/api/v1/customers?${queryParams.toString()}`);
        return response.data;
    },

    create: async (data: CustomerFormData) => {
        const response = await apiClient.post<Customer>("/api/v1/customers", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Customer>(`/api/v1/customers/${id}`);
        return response.data;
    },

    update: async (id: number, data: CustomerFormData) => {
        const response = await apiClient.put<Customer>(`/api/v1/customers/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/customers/${id}`);
    },

    bulkAssignAgent: async (customerIds: number[], agentId: number | null) => {
        const response = await apiClient.post<{
            success_count: number;
            failed_count: number;
            errors?: Array<{ customer_id: number; error: string }>;
            message: string;
        }>("/api/v1/customers/bulk-assign-agent", {
            customer_ids: customerIds,
            agent_id: agentId,
        });
        return response.data;
    }
};
