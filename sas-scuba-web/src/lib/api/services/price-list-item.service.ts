import apiClient from "../client";
import { PriceListItem, PriceListItemFormData, PriceListItemTier, PriceListItemTierFormData, PriceSuggestion } from "./price-list.service";

export interface PriceListItemFilters {
    service_type?: string;
    is_active?: boolean;
}

export const priceListItemService = {
    getAll: async (filters?: PriceListItemFilters) => {
        const params = new URLSearchParams();
        if (filters?.service_type) {
            params.append('service_type', filters.service_type);
        }
        if (filters?.is_active !== undefined) {
            params.append('is_active', filters.is_active.toString());
        }
        const queryString = params.toString();
        const url = `/api/v1/price-list-items${queryString ? `?${queryString}` : ''}`;
        const response = await apiClient.get<PriceListItem[]>(url);
        return response.data;
    },

    create: async (data: PriceListItemFormData) => {
        const response = await apiClient.post<PriceListItem>("/api/v1/price-list-items", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<PriceListItem>(`/api/v1/price-list-items/${id}`);
        return response.data;
    },

    update: async (id: number, data: Partial<PriceListItemFormData>) => {
        const response = await apiClient.put<PriceListItem>(`/api/v1/price-list-items/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/price-list-items/${id}`);
    },

    bulkUpdate: async (items: Array<{ id: number } & Partial<PriceListItemFormData>>) => {
        const response = await apiClient.post<{ data: PriceListItem[] }>("/api/v1/price-list-items/bulk", { items });
        return response.data;
    },

    getPriceSuggestions: async (diveCount: number, serviceType: string, customerId?: number) => {
        const params = new URLSearchParams();
        params.append('dive_count', diveCount.toString());
        params.append('service_type', serviceType);
        if (customerId) {
            params.append('customer_id', customerId.toString());
        }
        const response = await apiClient.get<{
            dive_count: number;
            service_type: string;
            customer_type: string | null;
            suggestions: PriceSuggestion[];
        }>(`/api/v1/price-list-items/suggest-price?${params.toString()}`);
        return response.data;
    },

    // Tier management methods
    getTiers: async (itemId: number | string) => {
        const response = await apiClient.get<PriceListItemTier[]>(`/api/v1/price-list-items/${itemId}/tiers`);
        return response.data;
    },

    createTier: async (itemId: number | string, data: PriceListItemTierFormData) => {
        const response = await apiClient.post<PriceListItemTier>(`/api/v1/price-list-items/${itemId}/tiers`, data);
        return response.data;
    },

    updateTier: async (itemId: number | string, tierId: number | string, data: Partial<PriceListItemTierFormData>) => {
        const response = await apiClient.put<PriceListItemTier>(`/api/v1/price-list-items/${itemId}/tiers/${tierId}`, data);
        return response.data;
    },

    deleteTier: async (itemId: number | string, tierId: number | string) => {
        await apiClient.delete(`/api/v1/price-list-items/${itemId}/tiers/${tierId}`);
    },
};

