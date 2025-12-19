import apiClient from "../client";

export interface EquipmentItem {
    id: number;
    equipment_id: number;
    location_id?: number;
    size?: string;
    serial_no?: string;
    inventory_code?: string;
    brand?: string;
    color?: string;
    image_url?: string;
    status: 'Available' | 'Rented' | 'Maintenance';
    purchase_date?: string;
    requires_service?: boolean;
    service_interval_days?: number;
    last_service_date?: string;
    next_service_date?: string;
    created_at: string;
    updated_at: string;
    equipment?: {
        id: number;
        name: string;
        category?: string;
    };
    location?: {
        id: number;
        name: string;
    };
}

export interface EquipmentItemFormData {
    equipment_id: number;
    location_id?: number;
    size?: string;
    serial_no?: string;
    inventory_code?: string;
    brand?: string;
    color?: string;
    image_url?: string;
    status: 'Available' | 'Rented' | 'Maintenance';
    purchase_date?: string;
    requires_service?: boolean;
    service_interval_days?: number;
    last_service_date?: string;
    next_service_date?: string;
}

export interface PaginationParams {
    page?: number;
    per_page?: number;
    search?: string;
    equipment_id?: number;
    status?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
}

export const equipmentItemService = {
    getAll: async (params?: PaginationParams) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.equipment_id) queryParams.append('equipment_id', params.equipment_id.toString());
        if (params?.status) queryParams.append('status', params.status);
        
        const response = await apiClient.get<PaginatedResponse<EquipmentItem>>(`/api/v1/equipment-items?${queryParams.toString()}`);
        return response.data;
    },

    create: async (data: EquipmentItemFormData) => {
        const response = await apiClient.post<EquipmentItem>("/api/v1/equipment-items", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<EquipmentItem>(`/api/v1/equipment-items/${id}`);
        return response.data;
    },

    update: async (id: number, data: EquipmentItemFormData) => {
        const response = await apiClient.put<EquipmentItem>(`/api/v1/equipment-items/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/equipment-items/${id}`);
    },

    createBulk: async (items: EquipmentItemFormData[]): Promise<{ success: EquipmentItem[], failed: { item: EquipmentItemFormData, error: any }[] }> => {
        const results = { success: [] as EquipmentItem[], failed: [] as { item: EquipmentItemFormData, error: any }[] };
        
        for (const item of items) {
            try {
                const created = await equipmentItemService.create(item);
                results.success.push(created);
            } catch (error) {
                results.failed.push({ item, error });
            }
        }
        
        return results;
    }
};

