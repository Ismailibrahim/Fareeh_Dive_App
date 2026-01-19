import apiClient from "../client";
import { PaginationParams, PaginatedResponse } from "./customer.service";

// Re-export PaginatedResponse for convenience
export type { PaginatedResponse } from "./customer.service";

export interface AgentContact {
    id?: number;
    contact_person_name: string;
    job_title?: string;
    email: string;
    phone?: string;
    secondary_contact?: string;
    preferred_communication_method?: 'Email' | 'Phone' | 'WhatsApp' | 'Other';
}

export interface AgentCommercialTerm {
    id?: number;
    commission_type: 'Percentage' | 'Fixed Amount';
    commission_rate: number;
    currency: string;
    vat_applicable?: boolean;
    tax_registration_no?: string;
    payment_terms: 'Prepaid' | 'Weekly' | 'Monthly' | 'On Invoice';
    credit_limit?: number;
    exclude_equipment_from_commission?: boolean;
    include_manual_items_in_commission?: boolean;
}

export interface AgentBillingInfo {
    id?: number;
    company_legal_name?: string;
    billing_address?: string;
    invoice_email?: string;
    bank_name?: string;
    account_name?: string;
    account_number?: string;
    swift_iban?: string;
    payment_method?: 'Bank Transfer' | 'Cash' | 'Online';
}

export interface AgentContract {
    id?: number;
    contract_start_date?: string;
    contract_end_date?: string;
    commission_valid_from?: string;
    commission_valid_until?: string;
    signed_agreement_url?: string;
    special_conditions?: string;
}

export interface Tag {
    id: number;
    name: string;
    color?: string;
}

export interface Agent {
    id: number;
    dive_center_id: number;
    agent_name: string;
    agent_type: 'Travel Agent' | 'Resort / Guest House' | 'Tour Operator' | 'Freelancer';
    country: string;
    city: string;
    status: 'Active' | 'Suspended';
    brand_name?: string;
    website?: string;
    notes?: string;
    contacts?: AgentContact[];
    commercial_terms?: AgentCommercialTerm;
    billing_info?: AgentBillingInfo;
    contract?: AgentContract;
    tags?: Tag[];
    // Performance metrics (calculated)
    total_clients_referred?: number;
    total_dives_booked?: number;
    total_revenue_generated?: number;
    total_commission_earned?: number;
    average_revenue_per_client?: number;
    last_booking_date?: string;
    active_clients_last_30_days?: number;
    active_clients_last_90_days?: number;
    created_at: string;
    updated_at: string;
}

export interface AgentFormData {
    agent_name: string;
    agent_type: 'Travel Agent' | 'Resort / Guest House' | 'Tour Operator' | 'Freelancer';
    country: string;
    city: string;
    status?: 'Active' | 'Suspended';
    brand_name?: string;
    website?: string;
    notes?: string;
    contact?: AgentContact;
    commercial_terms?: AgentCommercialTerm;
    billing_info?: AgentBillingInfo;
    contract?: AgentContract;
    tag_ids?: number[];
}

export interface AgentFilterParams extends PaginationParams {
    status?: 'Active' | 'Suspended';
    agent_type?: 'Travel Agent' | 'Resort / Guest House' | 'Tour Operator' | 'Freelancer';
    country?: string;
}

export const agentService = {
    getAll: async (params?: AgentFilterParams) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.agent_type) queryParams.append('agent_type', params.agent_type);
        if (params?.country) queryParams.append('country', params.country);
        
        const response = await apiClient.get<PaginatedResponse<Agent>>(`/api/v1/agents?${queryParams.toString()}`);
        return response.data;
    },

    create: async (data: AgentFormData) => {
        const response = await apiClient.post<Agent>("/api/v1/agents", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Agent>(`/api/v1/agents/${id}`);
        return response.data;
    },

    update: async (id: number, data: AgentFormData) => {
        const response = await apiClient.put<Agent>(`/api/v1/agents/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/agents/${id}`);
    },

    getPerformance: async (id: string | number) => {
        const response = await apiClient.get<{ agent: Agent; metrics: any }>(`/api/v1/agents/${id}/performance`);
        return response.data;
    },

    getCommissions: async (id: string | number, params?: PaginationParams) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
        if (params?.search) queryParams.append('search', params.search);
        
        const response = await apiClient.get<PaginatedResponse<any>>(`/api/v1/agents/${id}/commissions?${queryParams.toString()}`);
        return response.data;
    },

    calculateCommissions: async (id: string | number, invoiceIds?: number[]) => {
        const response = await apiClient.post(`/api/v1/agents/${id}/commissions/calculate`, {
            invoice_ids: invoiceIds || null,
        });
        return response.data;
    },
};

