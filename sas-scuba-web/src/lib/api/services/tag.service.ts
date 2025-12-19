import apiClient from "../client";

export interface Tag {
    id: number;
    dive_center_id: number;
    name: string;
    color?: string;
    created_at?: string;
    updated_at?: string;
}

export interface TagFormData {
    name: string;
    color?: string;
}

export const tagService = {
    getAll: async (params?: { search?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append('search', params.search);
        
        const response = await apiClient.get<Tag[]>(`/api/v1/tags?${queryParams.toString()}`);
        return response.data;
    },

    create: async (data: TagFormData) => {
        const response = await apiClient.post<Tag>("/api/v1/tags", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Tag>(`/api/v1/tags/${id}`);
        return response.data;
    },

    update: async (id: number, data: TagFormData) => {
        const response = await apiClient.put<Tag>(`/api/v1/tags/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/tags/${id}`);
    },

    attachToAgent: async (agentId: string | number, tagId: string | number) => {
        const response = await apiClient.post(`/api/v1/agents/${agentId}/tags/${tagId}`);
        return response.data;
    },

    detachFromAgent: async (agentId: string | number, tagId: string | number) => {
        await apiClient.delete(`/api/v1/agents/${agentId}/tags/${tagId}`);
    },
};

