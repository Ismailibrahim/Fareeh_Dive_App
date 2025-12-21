import apiClient from "../client";

export interface Unit {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export interface UnitFormData {
    name: string;
}

export const unitService = {
    getAll: async () => {
        const response = await apiClient.get<Unit[]>("/api/v1/units");
        return response.data;
    },

    create: async (data: UnitFormData) => {
        const response = await apiClient.post<Unit>("/api/v1/units", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Unit>(`/api/v1/units/${id}`);
        return response.data;
    },

    update: async (id: number, data: UnitFormData) => {
        const response = await apiClient.put<Unit>(`/api/v1/units/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/units/${id}`);
    }
};

