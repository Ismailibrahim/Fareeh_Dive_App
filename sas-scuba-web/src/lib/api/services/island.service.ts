import apiClient from "../client";

export interface Island {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export interface IslandFormData {
    name: string;
}

export const islandService = {
    getAll: async () => {
        const response = await apiClient.get<Island[]>("/api/v1/islands");
        return response.data;
    },

    create: async (data: IslandFormData) => {
        const response = await apiClient.post<Island>("/api/v1/islands", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Island>(`/api/v1/islands/${id}`);
        return response.data;
    },

    update: async (id: number, data: IslandFormData) => {
        const response = await apiClient.put<Island>(`/api/v1/islands/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/islands/${id}`);
    }
};

