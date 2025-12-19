import apiClient from "../client";

export interface Nationality {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export interface NationalityFormData {
    name: string;
}

export const nationalityService = {
    getAll: async () => {
        const response = await apiClient.get<Nationality[]>("/api/v1/nationalities");
        return response.data;
    },

    create: async (data: NationalityFormData) => {
        const response = await apiClient.post<Nationality>("/api/v1/nationalities", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Nationality>(`/api/v1/nationalities/${id}`);
        return response.data;
    },

    update: async (id: number, data: NationalityFormData) => {
        const response = await apiClient.put<Nationality>(`/api/v1/nationalities/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/nationalities/${id}`);
    }
};

