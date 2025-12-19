import apiClient from "../client";

export interface CustomerAccommodation {
    id: number;
    customer_id: number;
    name?: string;
    address?: string;
    contact_no?: string;
    island?: string;
    room_no?: string;
    created_at?: string;
    updated_at?: string;
}

export type CustomerAccommodationFormData = Omit<CustomerAccommodation, 'id' | 'created_at' | 'updated_at'>;

export const customerAccommodationService = {
    getAll: async (customerId?: number) => {
        const url = customerId
            ? `/api/v1/customer-accommodations?customer_id=${customerId}`
            : '/api/v1/customer-accommodations';
        const response = await apiClient.get<CustomerAccommodation[]>(url);
        return response.data;
    },

    getById: async (id: number) => {
        const response = await apiClient.get<CustomerAccommodation>(`/api/v1/customer-accommodations/${id}`);
        return response.data;
    },

    create: async (data: CustomerAccommodationFormData) => {
        const response = await apiClient.post<CustomerAccommodation>('/api/v1/customer-accommodations', data);
        return response.data;
    },

    update: async (id: number, data: Partial<CustomerAccommodationFormData>) => {
        const response = await apiClient.put<CustomerAccommodation>(`/api/v1/customer-accommodations/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/customer-accommodations/${id}`);
    }
};

