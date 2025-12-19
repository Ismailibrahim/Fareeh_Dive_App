import apiClient from "../client";

export interface CustomerInsurance {
    id: number;
    customer_id: number;
    insurance_provider?: string;
    insurance_no?: string;
    insurance_hotline_no?: string;
    file_url?: string;
    expiry_date?: string;
    status?: boolean;
    created_at?: string;
    updated_at?: string;
}

export type CustomerInsuranceFormData = Omit<CustomerInsurance, 'id' | 'created_at' | 'updated_at'>;

export const customerInsuranceService = {
    getAll: async (customerId?: number) => {
        const url = customerId
            ? `/api/v1/customer-insurances?customer_id=${customerId}`
            : '/api/v1/customer-insurances';
        const response = await apiClient.get<CustomerInsurance[]>(url);
        return response.data;
    },

    getById: async (id: number) => {
        const response = await apiClient.get<CustomerInsurance>(`/api/v1/customer-insurances/${id}`);
        return response.data;
    },

    create: async (data: CustomerInsuranceFormData) => {
        const response = await apiClient.post<CustomerInsurance>('/api/v1/customer-insurances', data);
        return response.data;
    },

    update: async (id: number, data: Partial<CustomerInsuranceFormData>) => {
        const response = await apiClient.put<CustomerInsurance>(`/api/v1/customer-insurances/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/customer-insurances/${id}`);
    }
};

