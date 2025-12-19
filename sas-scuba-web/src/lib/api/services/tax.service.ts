import apiClient from "../client";

export interface Tax {
    id: number;
    name: string;
    percentage: number;
    created_at?: string;
    updated_at?: string;
}

export interface TaxFormData {
    name: string;
    percentage: number;
}

export const taxService = {
    getAll: async () => {
        const response = await apiClient.get<Tax[]>("/api/v1/taxes");
        return response.data;
    },

    create: async (data: TaxFormData) => {
        const response = await apiClient.post<Tax>("/api/v1/taxes", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Tax>(`/api/v1/taxes/${id}`);
        return response.data;
    },

    update: async (id: number, data: TaxFormData) => {
        const response = await apiClient.put<Tax>(`/api/v1/taxes/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/taxes/${id}`);
    }
};

