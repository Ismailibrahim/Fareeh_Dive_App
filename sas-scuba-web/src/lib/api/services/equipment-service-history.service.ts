import apiClient from "../client";

export interface EquipmentServiceHistory {
    id: number;
    equipment_item_id: number;
    service_date: string;
    service_type?: string;
    technician?: string;
    service_provider?: string;
    cost?: number;
    notes?: string;
    parts_replaced?: string;
    warranty_info?: string;
    next_service_due_date?: string;
    created_at: string;
    updated_at: string;
    equipment_item?: {
        id: number;
        equipment_id: number;
    };
}

export interface EquipmentServiceHistoryFormData {
    service_date: string;
    service_type?: string;
    technician?: string;
    service_provider?: string;
    cost?: number;
    notes?: string;
    parts_replaced?: string;
    warranty_info?: string;
    next_service_due_date?: string;
}

export interface BulkServiceFormData {
    equipment_item_ids: number[];
    service_date: string;
    cost?: number;
    service_type?: string;
    technician?: string;
    service_provider?: string;
    notes?: string;
    next_service_due_date?: string;
}

export interface BulkServiceResponse {
    success: boolean;
    message: string;
    created_count: number;
    records: EquipmentServiceHistory[];
    errors?: Array<{
        equipment_item_id: number;
        error: string;
    }>;
}

export const equipmentServiceHistoryService = {
    getAll: async (equipmentItemId: string | number, page = 1) => {
        const params = new URLSearchParams({ page: page.toString() });
        const response = await apiClient.get<{ data: EquipmentServiceHistory[]; meta: any }>(
            `/api/v1/equipment-items/${equipmentItemId}/service-history?${params}`
        );
        return response.data;
    },

    create: async (equipmentItemId: string | number, data: EquipmentServiceHistoryFormData) => {
        const response = await apiClient.post<EquipmentServiceHistory>(
            `/api/v1/equipment-items/${equipmentItemId}/service-history`,
            data
        );
        return response.data;
    },

    getById: async (equipmentItemId: string | number, id: string | number) => {
        const response = await apiClient.get<EquipmentServiceHistory>(
            `/api/v1/equipment-items/${equipmentItemId}/service-history/${id}`
        );
        return response.data;
    },

    update: async (equipmentItemId: string | number, id: number, data: EquipmentServiceHistoryFormData) => {
        const response = await apiClient.put<EquipmentServiceHistory>(
            `/api/v1/equipment-items/${equipmentItemId}/service-history/${id}`,
            data
        );
        return response.data;
    },

    delete: async (equipmentItemId: string | number, id: number) => {
        await apiClient.delete(`/api/v1/equipment-items/${equipmentItemId}/service-history/${id}`);
    },

    bulkCreate: async (data: BulkServiceFormData) => {
        const response = await apiClient.post<BulkServiceResponse>(
            '/api/v1/equipment-items/bulk-service',
            data
        );
        return response.data;
    }
};

