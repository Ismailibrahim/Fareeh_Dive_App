import apiClient from "../client";

export interface User {
    id: number;
    dive_center_id: number;
    full_name: string;
    email: string;
    phone?: string;
    role: 'Admin' | 'Instructor' | 'DiveMaster' | 'Agent';
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface UserFormData {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
    role: 'Admin' | 'Instructor' | 'DiveMaster' | 'Agent';
    active?: boolean;
}

export const userService = {
    getAll: async (page = 1) => {
        const response = await apiClient.get<{ data: User[]; meta: any }>(`/api/v1/users?page=${page}`);
        return response.data;
    },

    create: async (data: UserFormData) => {
        const response = await apiClient.post<User>("/api/v1/users", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<User>(`/api/v1/users/${id}`);
        return response.data;
    },

    update: async (id: number, data: Partial<UserFormData>) => {
        const response = await apiClient.put<User>(`/api/v1/users/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/users/${id}`);
    }
};

