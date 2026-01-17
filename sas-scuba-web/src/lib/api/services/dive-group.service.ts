import apiClient from "../client";
import { PaginatedResponse } from "./customer.service";
import { Agent } from "./agent.service";
import { Customer } from "./customer.service";
import { Booking } from "./booking.service";
import { Invoice } from "./invoice.service";

export interface DiveGroup {
    id: number;
    dive_center_id: number;
    group_name: string;
    agent_id?: number;
    agent?: Agent;
    description?: string;
    status: 'Active' | 'Inactive';
    created_by?: number;
    created_at: string;
    updated_at: string;
    members?: Customer[];
    member_count?: number;
    bookings?: Booking[];
    related_invoices?: Invoice[];
}

export interface DiveGroupFormData {
    group_name: string;
    agent_id?: number;
    description?: string;
    status?: 'Active' | 'Inactive';
    member_ids?: number[];
}

export interface BookGroupRequest {
    booking_type: 'individual' | 'group';
    dive_site_id: number;
    boat_id?: number;
    dive_date?: string;
    dive_time?: string;
    price_list_item_id?: number;
    price?: number;
    booking_date?: string;
    number_of_divers?: number;
    status?: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
}

export interface GenerateInvoiceRequest {
    invoice_type: 'single' | 'separate';
    booking_ids?: number[];
    invoice_type_detail?: 'Advance' | 'Final' | 'Full';
    include_dives?: boolean;
    include_equipment?: boolean;
    tax_percentage?: number;
}

export const diveGroupService = {
    getAll: async (params?: {
        page?: number;
        per_page?: number;
        search?: string;
        agent_id?: number;
        status?: 'Active' | 'Inactive';
    }) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.agent_id) queryParams.append('agent_id', params.agent_id.toString());
        if (params?.status) queryParams.append('status', params.status);

        const response = await apiClient.get<PaginatedResponse<DiveGroup>>(
            `/api/v1/dive-groups?${queryParams.toString()}`
        );
        return response.data;
    },

    create: async (data: DiveGroupFormData) => {
        const response = await apiClient.post<DiveGroup>("/api/v1/dive-groups", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<DiveGroup>(`/api/v1/dive-groups/${id}`);
        return response.data;
    },

    update: async (id: number, data: Partial<DiveGroupFormData>) => {
        const response = await apiClient.put<DiveGroup>(`/api/v1/dive-groups/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/dive-groups/${id}`);
    },

    addMember: async (groupId: number, customerId: number) => {
        const response = await apiClient.post<DiveGroup>(
            `/api/v1/dive-groups/${groupId}/members`,
            { customer_id: customerId }
        );
        return response.data;
    },

    removeMember: async (groupId: number, customerId: number) => {
        const response = await apiClient.delete<DiveGroup>(
            `/api/v1/dive-groups/${groupId}/members/${customerId}`
        );
        return response.data;
    },

    bookGroup: async (groupId: number, data: BookGroupRequest) => {
        const response = await apiClient.post<{
            message: string;
            bookings: Booking[];
            booking_dives: any[];
        }>(`/api/v1/dive-groups/${groupId}/book`, data);
        return response.data;
    },

    generateInvoice: async (groupId: number, data: GenerateInvoiceRequest) => {
        const response = await apiClient.post<{
            message: string;
            invoices: Invoice[];
        }>(`/api/v1/dive-groups/${groupId}/invoice`, data);
        return response.data;
    },
};

