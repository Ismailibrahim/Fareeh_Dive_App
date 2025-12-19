import apiClient from "../client";

export interface Category {
    id: number;
    dive_center_id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export interface CategoryFormData {
    name: string;
}

export const categoryService = {
    getAll: async () => {
        const response = await apiClient.get<Category[]>("/api/v1/categories");
        return response.data;
    },

    create: async (data: CategoryFormData) => {
        const response = await apiClient.post<Category>("/api/v1/categories", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Category>(`/api/v1/categories/${id}`);
        return response.data;
    },

    update: async (id: number, data: CategoryFormData) => {
        const response = await apiClient.put<Category>(`/api/v1/categories/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/categories/${id}`);
    }
};

