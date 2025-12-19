import apiClient from "../client";

export interface ServiceProvider {
    id: number;
    name: string;
    address?: string;
    contact_no?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ServiceProviderFormData {
    name: string;
    address?: string;
    contact_no?: string;
}

export const serviceProviderService = {
    getAll: async () => {
        const response = await apiClient.get<ServiceProvider[]>("/api/v1/service-providers");
        return response.data;
    },

    create: async (data: ServiceProviderFormData) => {
        const response = await apiClient.post<ServiceProvider>("/api/v1/service-providers", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<ServiceProvider>(`/api/v1/service-providers/${id}`);
        return response.data;
    },

    update: async (id: number, data: ServiceProviderFormData) => {
        const response = await apiClient.put<ServiceProvider>(`/api/v1/service-providers/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/service-providers/${id}`);
    }
};

