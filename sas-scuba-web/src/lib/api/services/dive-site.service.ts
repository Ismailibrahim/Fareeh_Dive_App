import apiClient from "../client";

export interface DiveSite {
    id: number;
    dive_center_id: number;
    name: string;
    max_depth?: number;
    description?: string;
    latitude?: number;
    longitude?: number;
    location?: string;
    pax_capacity?: number;
    attachment?: string;
    created_at: string;
    updated_at: string;
}

export interface DiveSiteFormData {
    name: string;
    max_depth?: number;
    description?: string;
    latitude?: number;
    longitude?: number;
    location?: string;
    pax_capacity?: number;
    attachment?: string;
}

export const diveSiteService = {
    getAll: async (page = 1) => {
        const response = await apiClient.get<{ data: DiveSite[]; meta: any }>(`/api/v1/dive-sites?page=${page}`);
        return response.data;
    },

    create: async (data: DiveSiteFormData) => {
        const response = await apiClient.post<DiveSite>("/api/v1/dive-sites", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<DiveSite>(`/api/v1/dive-sites/${id}`);
        return response.data;
    },

    update: async (id: number, data: DiveSiteFormData) => {
        const response = await apiClient.put<DiveSite>(`/api/v1/dive-sites/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/dive-sites/${id}`);
    }
};

