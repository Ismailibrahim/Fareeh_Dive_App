import apiClient from "../client";

export interface EmergencyContact {
    id: number;
    customer_id: number;
    name?: string;
    email?: string;
    phone_1?: string;
    phone_2?: string;
    phone_3?: string;
    address?: string;
    relationship?: string;
    is_primary?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface EmergencyContactFormData {
    name?: string;
    email?: string;
    phone_1?: string;
    phone_2?: string;
    phone_3?: string;
    address?: string;
    relationship?: string;
    is_primary?: boolean;
}

export const emergencyContactService = {
    getAll: async (customerId?: string | number) => {
        const url = customerId
            ? `/api/v1/customers/${customerId}/emergency-contacts`
            : '/api/v1/emergency-contacts';
        const response = await apiClient.get<EmergencyContact[]>(url);
        return response.data;
    },

    create: async (customerId: string | number, data: EmergencyContactFormData) => {
        const response = await apiClient.post<EmergencyContact>(`/api/v1/customers/${customerId}/emergency-contacts`, data);
        return response.data;
    },

    getById: async (customerId: string | number, id: string | number) => {
        const response = await apiClient.get<EmergencyContact>(`/api/v1/customers/${customerId}/emergency-contacts/${id}`);
        return response.data;
    },

    update: async (customerId: string | number, id: number, data: EmergencyContactFormData) => {
        const response = await apiClient.put<EmergencyContact>(`/api/v1/customers/${customerId}/emergency-contacts/${id}`, data);
        return response.data;
    },

    delete: async (customerId: string | number, id: number) => {
        await apiClient.delete(`/api/v1/customers/${customerId}/emergency-contacts/${id}`);
    }
};

