import apiClient from "../client";

export interface Country {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export interface CountryFormData {
    name: string;
}

export const countryService = {
    getAll: async () => {
        const response = await apiClient.get<Country[]>("/api/v1/countries");
        return response.data;
    },

    create: async (data: CountryFormData) => {
        const response = await apiClient.post<Country>("/api/v1/countries", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Country>(`/api/v1/countries/${id}`);
        return response.data;
    },

    update: async (id: number, data: CountryFormData) => {
        const response = await apiClient.put<Country>(`/api/v1/countries/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/countries/${id}`);
    }
};

