import apiClient from "../client";

export interface CustomerCertification {
    id: number;
    customer_id: number;
    certification_name: string;
    certification_no?: string;
    certification_date: string;
    last_dive_date?: string;
    no_of_dives?: number;
    agency?: string;
    instructor?: string;
    file_url?: string;
    license_status?: boolean;
    created_at?: string;
    updated_at?: string;
}

export type CustomerCertificationFormData = Omit<CustomerCertification, 'id' | 'created_at' | 'updated_at'>;

export const customerCertificationService = {
    getAll: async (customerId?: number) => {
        const url = customerId
            ? `/api/v1/customer-certifications?customer_id=${customerId}`
            : '/api/v1/customer-certifications';
        const response = await apiClient.get<CustomerCertification[]>(url);
        return response.data;
    },

    getById: async (id: number) => {
        const response = await apiClient.get<CustomerCertification>(`/api/v1/customer-certifications/${id}`);
        return response.data;
    },

    create: async (data: CustomerCertificationFormData) => {
        const response = await apiClient.post<CustomerCertification>('/api/v1/customer-certifications', data);
        return response.data;
    },

    update: async (id: number, data: Partial<CustomerCertificationFormData>) => {
        const response = await apiClient.put<CustomerCertification>(`/api/v1/customer-certifications/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/customer-certifications/${id}`);
    }
};
