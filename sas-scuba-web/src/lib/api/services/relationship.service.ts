import apiClient from "../client";

export interface Relationship {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export interface RelationshipFormData {
    name: string;
}

export const relationshipService = {
    getAll: async () => {
        const response = await apiClient.get<Relationship[]>("/api/v1/relationships");
        return response.data;
    },

    create: async (data: RelationshipFormData) => {
        const response = await apiClient.post<Relationship>("/api/v1/relationships", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Relationship>(`/api/v1/relationships/${id}`);
        return response.data;
    },

    update: async (id: number, data: RelationshipFormData) => {
        const response = await apiClient.put<Relationship>(`/api/v1/relationships/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/relationships/${id}`);
    }
};

