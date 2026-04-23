import apiClient from "../client";

export interface Boat {
    id: number;
    dive_center_id: number;
    name: string;
    capacity?: number;
    tank_capacity?: number;
    active: boolean;
    is_owned: boolean; // Keep for backward compatibility if needed
    ownership_type: 'Owned' | 'Rented';
    rent_start_date?: string;
    rent_end_date?: string;
    is_rental_expired?: boolean;
    created_at: string;
    updated_at: string;
}

export interface BoatFormData {
    name: string;
    capacity?: number;
    tank_capacity?: number;
    active?: boolean;
    is_owned?: boolean;
    ownership_type?: 'Owned' | 'Rented';
    rent_start_date?: string;
    rent_end_date?: string;
}

export const boatService = {
    getAll: async (page = 1, active?: boolean) => {
        const params = new URLSearchParams({ page: page.toString() });
        if (active !== undefined) params.append('active', active.toString());
        
        const response = await apiClient.get<{ data: Boat[]; meta: any }>(`/api/v1/boats?${params}`);
        return response.data;
    },

    create: async (data: BoatFormData) => {
        const response = await apiClient.post<Boat>("/api/v1/boats", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Boat>(`/api/v1/boats/${id}`);
        return response.data;
    },

    update: async (id: number, data: BoatFormData) => {
        const response = await apiClient.put<Boat>(`/api/v1/boats/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/boats/${id}`);
    }
};

