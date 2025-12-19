import apiClient from '../client';

export interface DiveCenterData {
    id: number;
    name: string;
    legal_name?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country: string;
    timezone?: string;
    currency?: string;
    settings?: Record<string, any>;
    logo?: string;
}

export const settingsService = {
    async getDiveCenter() {
        const response = await apiClient.get<DiveCenterData>('/api/v1/dive-center');
        return response.data;
    },

    async updateDiveCenter(data: Partial<DiveCenterData>) {
        const response = await apiClient.put<{ message: string; dive_center: DiveCenterData }>('/api/v1/dive-center', data);
        return response.data;
    }
};
