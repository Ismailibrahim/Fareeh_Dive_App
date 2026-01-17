import apiClient from "../client";

export interface Excursion {
    id: number;
    dive_center_id: number;
    name: string;
    description?: string;
    duration?: number;
    location?: string;
    capacity?: number;
    meeting_point?: string;
    departure_time?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ExcursionFormData {
    name: string;
    description?: string;
    duration?: number;
    location?: string;
    capacity?: number;
    meeting_point?: string;
    departure_time?: string;
    is_active?: boolean;
}

export const excursionService = {
    getAll: async (page = 1) => {
        const response = await apiClient.get<{ data: Excursion[]; meta: any }>(`/api/v1/excursions?page=${page}`);
        return response.data;
    },

    create: async (data: ExcursionFormData) => {
        const response = await apiClient.post<Excursion>("/api/v1/excursions", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Excursion>(`/api/v1/excursions/${id}`);
        return response.data;
    },

    update: async (id: number, data: ExcursionFormData) => {
        const response = await apiClient.put<Excursion>(`/api/v1/excursions/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/excursions/${id}`);
    }
};
