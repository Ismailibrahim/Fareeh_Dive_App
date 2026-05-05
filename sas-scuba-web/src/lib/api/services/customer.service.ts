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
    price_list_id?: number;
    price_list?: {
        id: number;
        name: string;
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
    price_list_id?: number | null;

    // Nested relations
    emergency_contacts?: Array<{
        name?: string;
        relationship?: string;
        phone_1?: string;
        email?: string;
        is_primary?: boolean;
    }>;
    certifications?: Array<{
        certification_name?: string;
        certification_no?: string;
        expiry_date?: string;
    }>;
    insurance?: {
        insurance_provider?: string;
        insurance_no?: string;
        insurance_hotline_no?: string;
        expiry_date?: string;
    };
    accommodation?: {
        name?: string;
        contact_no?: string;
        address?: string;
    };
    medical_forms?: Record<string, boolean>;
    equipment_request?: EquipmentRequestData;
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

export interface EquipmentRequestItem {
    equipment_type_name: string;
    rent: boolean;
    own: boolean;
    note: string;
}

export interface EquipmentRequestData {
    expected_return_date?: string | null;
    notes?: string | null;
    items: EquipmentRequestItem[];
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
    },

    getEquipmentRequest: async (customerId: string | number) => {
        const response = await apiClient.get(`/api/v1/customers/${customerId}/equipment-request`);
        return response.data;
    },

    updateEquipmentRequest: async (customerId: string | number, data: EquipmentRequestData) => {
        const response = await apiClient.put(`/api/v1/customers/${customerId}/equipment-request`, data);
        return response.data;
    }
};
