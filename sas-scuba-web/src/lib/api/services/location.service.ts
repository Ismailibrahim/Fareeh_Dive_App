import apiClient from "../client";

export interface Location {
    id: number;
    dive_center_id: number;
    name: string;
    description?: string;
    active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface LocationFormData {
    name: string;
    description?: string;
    active?: boolean;
}

export const locationService = {
    getAll: async () => {
        const response = await apiClient.get<Location[]>("/api/v1/locations");
        return response.data;
    },

    create: async (data: LocationFormData) => {
        const response = await apiClient.post<Location>("/api/v1/locations", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Location>(`/api/v1/locations/${id}`);
        return response.data;
    },

    update: async (id: number, data: LocationFormData) => {
        const response = await apiClient.put<Location>(`/api/v1/locations/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/locations/${id}`);
    }
};

