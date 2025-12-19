import apiClient from "../client";

export interface Agency {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export interface AgencyFormData {
    name: string;
}

export const agencyService = {
    getAll: async () => {
        const response = await apiClient.get<Agency[]>("/api/v1/agencies");
        return response.data;
    },

    create: async (data: AgencyFormData) => {
        const response = await apiClient.post<Agency>("/api/v1/agencies", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Agency>(`/api/v1/agencies/${id}`);
        return response.data;
    },

    update: async (id: number, data: AgencyFormData) => {
        const response = await apiClient.put<Agency>(`/api/v1/agencies/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/agencies/${id}`);
    }
};

