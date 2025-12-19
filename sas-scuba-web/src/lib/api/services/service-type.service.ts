import apiClient from "../client";

export interface ServiceType {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export interface ServiceTypeFormData {
    name: string;
}

export const serviceTypeService = {
    getAll: async () => {
        const response = await apiClient.get<ServiceType[]>("/api/v1/service-types");
        return response.data;
    },

    create: async (data: ServiceTypeFormData) => {
        const response = await apiClient.post<ServiceType>("/api/v1/service-types", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<ServiceType>(`/api/v1/service-types/${id}`);
        return response.data;
    },

    update: async (id: number, data: ServiceTypeFormData) => {
        const response = await apiClient.put<ServiceType>(`/api/v1/service-types/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/service-types/${id}`);
    }
};

