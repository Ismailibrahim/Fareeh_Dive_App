import apiClient from '../client';
import type { Customer } from './customer.service';

export interface Waiver {
    id: number;
    dive_center_id: number;
    name: string;
    slug: string;
    type: 'liability' | 'medical' | 'checklist' | 'custom';
    description?: string;
    content: string;
    fields?: FormField[];
    translations?: Record<string, Record<string, string>>;
    requires_signature: boolean;
    expiry_days?: number;
    require_witness: boolean;
    is_active: boolean;
    display_order: number;
    generate_qr_code: boolean;
    qr_code_url?: string;
    created_by?: number;
    created_at: string;
    updated_at: string;
}

export interface FormField {
    id: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'number';
    label: string;
    name: string;
    required?: boolean;
    options?: { value: string; label: string }[];
    placeholder?: string;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    };
}

export interface WaiverSignature {
    id: number;
    waiver_id: number;
    customer_id: number;
    booking_id?: number;
    signature_data: string;
    signature_format: string;
    form_data?: Record<string, any>;
    signed_by_user_id?: number;
    witness_user_id?: number;
    ip_address?: string;
    user_agent?: string;
    signed_at: string;
    expires_at?: string;
    is_valid: boolean;
    invalidated_at?: string;
    invalidation_reason?: string;
    verification_status: 'pending' | 'verified' | 'rejected';
    verified_by?: number;
    verified_at?: string;
    verification_notes?: string;
    waiver?: Waiver;
    customer?: Customer;
}

export interface WaiverStatus {
    status: 'missing' | 'expired' | 'valid';
    message: string;
    signed_at?: string;
    expires_at?: string;
    days_until_expiry?: number;
    signature?: WaiverSignature;
}

export const waiverService = {
    getAll: async () => {
        const response = await apiClient.get<{ success: boolean; data: Waiver[] }>('/api/v1/waivers');
        return response.data;
    },
    
    getById: async (id: number) => {
        const response = await apiClient.get<{ success: boolean; data: Waiver }>(`/api/v1/waivers/${id}`);
        return response.data;
    },
    
    create: async (data: Partial<Waiver>) => {
        const response = await apiClient.post<{ success: boolean; data: Waiver }>('/api/v1/waivers', data);
        return response.data;
    },
    
    update: async (id: number, data: Partial<Waiver>) => {
        const response = await apiClient.put<{ success: boolean; data: Waiver }>(`/api/v1/waivers/${id}`, data);
        return response.data;
    },
    
    delete: async (id: number) => {
        const response = await apiClient.delete<{ success: boolean; message: string }>(`/api/v1/waivers/${id}`);
        return response.data;
    },
    
    // Signatures
    getSignatures: async (params?: {
        customer_id?: number;
        waiver_id?: number;
        is_valid?: boolean;
        expired?: boolean;
    }) => {
        const response = await apiClient.get<{ 
            success: boolean; 
            data: { 
                data: WaiverSignature[];
                current_page?: number;
                per_page?: number;
                total?: number;
                last_page?: number;
            } 
        }>(
            '/api/v1/waiver-signatures',
            { params }
        );
        // Laravel pagination returns: { success: true, data: { data: [...], current_page, ... } }
        // Axios wraps it, so response.data = { success: true, data: { data: [...], ... } }
        // We need response.data.data which is the paginated object
        const paginatedData = response.data?.data;
        if (paginatedData && 'data' in paginatedData) {
            return paginatedData;
        }
        // Fallback for non-paginated response
        return { data: paginatedData?.data || [] };
    },
    
    createSignature: async (data: {
        waiver_id: number;
        customer_id: number;
        signature_data: string;
        booking_id?: number;
        form_data?: Record<string, any>;
        witness_user_id?: number;
        signature_format?: string;
    }) => {
        const response = await apiClient.post<{ success: boolean; data: WaiverSignature }>(
            '/api/v1/waiver-signatures',
            data
        );
        return response.data;
    },
    
    verifySignature: async (signatureId: number, status: 'verified' | 'rejected', notes?: string) => {
        const response = await apiClient.post<{ success: boolean; data: WaiverSignature }>(
            `/api/v1/waiver-signatures/${signatureId}/verify`,
            { status, notes }
        );
        return response.data;
    },
    
    invalidateSignature: async (signatureId: number, reason: string) => {
        const response = await apiClient.post<{ success: boolean; message: string }>(
            `/api/v1/waiver-signatures/${signatureId}/invalidate`,
            { reason }
        );
        return response.data;
    },
    
    getCustomerWaiverStatus: async (customerId: number, waiverId: number) => {
        const response = await apiClient.get<{ success: boolean; data: WaiverStatus }>(
            `/api/v1/customers/${customerId}/waivers/status?waiver_id=${waiverId}`
        );
        return response.data;
    },
    
    getRequiredWaivers: async (customerId: number) => {
        const response = await apiClient.get<{ success: boolean; data: Array<{ waiver: Waiver; status: WaiverStatus; signature?: WaiverSignature }> }>(
            `/api/v1/customers/${customerId}/waivers/required`
        );
        return response.data;
    },
};
