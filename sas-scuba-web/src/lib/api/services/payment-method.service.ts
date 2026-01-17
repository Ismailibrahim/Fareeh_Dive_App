import apiClient from "../client";

export type PaymentMethodType = 'Bank Transfer' | 'Crypto' | 'Credit Card' | 'Wallet' | 'Cash';

export interface PaymentMethod {
    id: number;
    dive_center_id: number;
    method_type: PaymentMethodType;
    name: string;
    is_active: boolean;
    settings?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface CreatePaymentMethodRequest {
    method_type: PaymentMethodType;
    name: string;
    is_active?: boolean;
    settings?: Record<string, any>;
}

export interface UpdatePaymentMethodRequest {
    method_type?: PaymentMethodType;
    name?: string;
    is_active?: boolean;
    settings?: Record<string, any>;
}

export const paymentMethodService = {
    getAll: async (params?: { method_type?: PaymentMethodType; is_active?: boolean }) => {
        const queryParams = new URLSearchParams();
        if (params?.method_type) {
            queryParams.append('method_type', params.method_type);
        }
        if (params?.is_active !== undefined) {
            queryParams.append('is_active', params.is_active.toString());
        }
        const queryString = queryParams.toString();
        const url = `/api/v1/payment-methods${queryString ? `?${queryString}` : ''}`;
        const response = await apiClient.get<PaymentMethod[]>(url);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<PaymentMethod>(`/api/v1/payment-methods/${id}`);
        return response.data;
    },

    create: async (data: CreatePaymentMethodRequest) => {
        const response = await apiClient.post<PaymentMethod>("/api/v1/payment-methods", data);
        return response.data;
    },

    update: async (id: number, data: UpdatePaymentMethodRequest) => {
        const response = await apiClient.put<PaymentMethod>(`/api/v1/payment-methods/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/payment-methods/${id}`);
    },
};


