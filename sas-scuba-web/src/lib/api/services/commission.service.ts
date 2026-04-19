import apiClient from "../client";
import { PaginationParams, PaginatedResponse } from "./types";

export interface AgentCommission {
    id: number;
    agent_id: number;
    invoice_id: number;
    commission_amount: string;
    status: 'Pending' | 'Paid' | 'Cancelled';
    calculated_at: string;
    paid_at?: string | null;
    notes?: string | null;
    payment_method_id?: number | null;
    payment_reference?: string | null;
    payment_notes?: string | null;
    agent?: {
        id: number;
        name: string;
        agent_type: string;
    };
    invoice?: {
        id: number;
        invoice_no: string;
        invoice_date: string;
        total: string;
        customer?: {
            id: number;
            first_name: string;
            last_name: string;
        };
        booking?: {
            id: number;
            customer?: {
                id: number;
                first_name: string;
                last_name: string;
            };
        };
    };
    payment_method?: {
        id: number;
        name: string;
    };
}

export interface CommissionFilterParams extends PaginationParams {
    status?: 'Pending' | 'Paid' | 'Cancelled';
    agent_id?: number;
    date_from?: string;
    date_to?: string;
    search?: string;
}

export interface UpdateCommissionRequest {
    status?: 'Pending' | 'Paid' | 'Cancelled';
    notes?: string;
    payment_method_id?: number;
    payment_reference?: string;
    payment_notes?: string;
    paid_at?: string;
}

export interface CalculateCommissionRequest {
    invoice_ids?: number[];
}

export const commissionService = {
    /**
     * Get all commissions with filters
     */
    getAll: async (params?: CommissionFilterParams) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
        if (params?.status) queryParams.append('status', params.status);
        if (params?.agent_id) queryParams.append('agent_id', params.agent_id.toString());
        if (params?.date_from) queryParams.append('date_from', params.date_from);
        if (params?.date_to) queryParams.append('date_to', params.date_to);
        if (params?.search) queryParams.append('search', params.search);
        
        const response = await apiClient.get<PaginatedResponse<AgentCommission>>(
            `/api/v1/commissions?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Get commission by ID
     */
    getById: async (id: string | number) => {
        const response = await apiClient.get<AgentCommission>(`/api/v1/commissions/${id}`);
        return response.data;
    },

    /**
     * Update commission status and payment info
     */
    updateStatus: async (id: number, data: UpdateCommissionRequest) => {
        const response = await apiClient.put<AgentCommission>(`/api/v1/commissions/${id}`, data);
        return response.data;
    },

    /**
     * Mark commission as paid
     */
    markAsPaid: async (
        id: number,
        paymentDate?: string,
        paymentMethodId?: number,
        paymentReference?: string,
        paymentNotes?: string
    ) => {
        const data: UpdateCommissionRequest = {
            status: 'Paid',
            paid_at: paymentDate || new Date().toISOString().split('T')[0],
        };
        if (paymentMethodId) data.payment_method_id = paymentMethodId;
        if (paymentReference) data.payment_reference = paymentReference;
        if (paymentNotes) data.payment_notes = paymentNotes;
        
        const response = await apiClient.put<AgentCommission>(`/api/v1/commissions/${id}`, data);
        return response.data;
    },

    /**
     * Cancel commission
     */
    cancel: async (id: number, reason?: string) => {
        const data: UpdateCommissionRequest = {
            status: 'Cancelled',
        };
        if (reason) data.notes = reason;
        
        const response = await apiClient.put<AgentCommission>(`/api/v1/commissions/${id}`, data);
        return response.data;
    },

    /**
     * Calculate commissions for an agent
     */
    calculateForAgent: async (agentId: number, invoiceIds?: number[]) => {
        const response = await apiClient.post<{
            message: string;
            commissions: AgentCommission[];
            count: number;
        }>(`/api/v1/agents/${agentId}/commissions/calculate`, {
            invoice_ids: invoiceIds || null,
        });
        return response.data;
    },

    /**
     * Get all pending commissions (payable report)
     */
    getPayable: async (params?: PaginationParams) => {
        return commissionService.getAll({
            ...params,
            status: 'Pending',
        });
    },
};
