import apiClient from "../client";

export interface PriceList {
    id: number;
    dive_center_id: number;
    name: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    items?: PriceListItem[];
    base_currency?: string;
}

export interface PriceListFormData {
    name: string;
    notes?: string;
}

export interface PriceListItem {
    id: number;
    price_list_id: number;
    service_type: string;
    equipment_item_id?: number;
    name: string;
    description?: string;
    price: number;
    unit?: string;
    tax_percentage?: number;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PriceListItemFormData {
    service_type: string;
    is_equipment_rental?: boolean;
    equipment_item_id?: number;
    name: string;
    description?: string;
    price: number;
    unit?: string;
    tax_percentage?: number;
    sort_order?: number;
    is_active?: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export const priceListService = {
    getAll: async (page: number = 1, perPage: number = 20) => {
        const response = await apiClient.get<PaginatedResponse<PriceList>>("/api/v1/price-lists", {
            params: { page, per_page: perPage },
        });
        return response.data;
    },

    getById: async (id: number | string) => {
        const response = await apiClient.get<PriceList>(`/api/v1/price-lists/${id}`);
        return response.data;
    },

    create: async (data: PriceListFormData) => {
        const response = await apiClient.post<PriceList>("/api/v1/price-lists", data);
        return response.data;
    },

    update: async (id: number | string, data: PriceListFormData) => {
        const response = await apiClient.put<PriceList>(`/api/v1/price-lists/${id}`, data);
        return response.data;
    },

    delete: async (id: number | string) => {
        const response = await apiClient.delete(`/api/v1/price-lists/${id}`);
        return response.data;
    },

    // Legacy method for backward compatibility - gets first price list or creates one
    get: async () => {
        const lists = await priceListService.getAll(1, 1);
        if (lists.data.length > 0) {
            return lists.data[0];
        }
        // Create default if none exists
        return await priceListService.create({ name: "Default Price List" });
    },
};

