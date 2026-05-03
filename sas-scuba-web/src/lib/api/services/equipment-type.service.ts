import apiClient from '../client';

export interface EquipmentType {
    id: number;
    dive_center_id: number;
    name: string;
    active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface EquipmentTypeFormData {
    name: string;
    active?: boolean;
}

export const equipmentTypeService = {
    getAll: async (activeOnly?: boolean) => {
        const url = activeOnly ? '/api/v1/settings/equipment-types?active=1' : '/api/v1/settings/equipment-types';
        const response = await apiClient.get<EquipmentType[]>(url);
        return response.data;
    },

    getById: async (id: number | string) => {
        const response = await apiClient.get<EquipmentType>(`/api/v1/settings/equipment-types/${id}`);
        return response.data;
    },

    create: async (data: EquipmentTypeFormData) => {
        const response = await apiClient.post<EquipmentType>('/api/v1/settings/equipment-types', data);
        return response.data;
    },

    update: async (id: number | string, data: EquipmentTypeFormData) => {
        const response = await apiClient.put<EquipmentType>(`/api/v1/settings/equipment-types/${id}`, data);
        return response.data;
    },

    delete: async (id: number | string) => {
        const response = await apiClient.delete(`/api/v1/settings/equipment-types/${id}`);
        return response.data;
    }
};
