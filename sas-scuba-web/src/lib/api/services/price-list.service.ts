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
    base_price?: number;
    pricing_model?: 'SINGLE' | 'RANGE' | 'TIERED';
    min_dives?: number;
    max_dives?: number;
    priority?: number;
    valid_from?: string;
    valid_until?: string;
    applicable_to?: 'ALL' | 'MEMBER' | 'NON_MEMBER' | 'GROUP' | 'CORPORATE';
    unit?: string;
    tax_percentage?: number;
    tax_inclusive?: boolean;
    service_charge_inclusive?: boolean;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    price_tiers?: PriceListItemTier[];
}

export interface PriceListItemTier {
    id: number;
    item_id: number;
    tier_name?: string;
    from_dives: number;
    to_dives: number;
    price_per_dive: number;
    total_price?: number;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface PricingRule {
    id: number;
    rule_name: string;
    rule_type: 'OVERLAP_HANDLING' | 'VALIDATION' | 'DISCOUNT' | 'SURCHARGE';
    condition?: Record<string, any>;
    action: 'APPLY_LOWEST' | 'APPLY_HIGHEST_PRIORITY' | 'REJECT' | 'WARN';
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PriceSuggestion {
    id: number;
    name: string;
    description?: string;
    pricing_model: 'SINGLE' | 'RANGE' | 'TIERED';
    min_dives: number;
    max_dives: number;
    priority: number;
    price: number;
    base_price: number;
    applicable_to: 'ALL' | 'MEMBER' | 'NON_MEMBER' | 'GROUP' | 'CORPORATE';
}

export interface PriceListItemFormData {
    price_list_id?: number;
    service_type: string;
    is_equipment_rental?: boolean;
    equipment_item_id?: number;
    name: string;
    description?: string;
    price: number;
    base_price?: number;
    pricing_model?: 'SINGLE' | 'RANGE' | 'TIERED';
    min_dives?: number;
    max_dives?: number;
    priority?: number;
    valid_from?: string;
    valid_until?: string;
    applicable_to?: 'ALL' | 'MEMBER' | 'NON_MEMBER' | 'GROUP' | 'CORPORATE';
    unit?: string;
    tax_percentage?: number;
    tax_inclusive?: boolean;
    service_charge_inclusive?: boolean;
    sort_order?: number;
    is_active?: boolean;
}

export interface PriceListItemTierFormData {
    tier_name?: string;
    from_dives: number;
    to_dives: number;
    price_per_dive: number;
    total_price?: number;
    is_active?: boolean;
    sort_order?: number;
}

export interface PricingRuleFormData {
    rule_name: string;
    rule_type: 'OVERLAP_HANDLING' | 'VALIDATION' | 'DISCOUNT' | 'SURCHARGE';
    condition?: Record<string, any>;
    action: 'APPLY_LOWEST' | 'APPLY_HIGHEST_PRIORITY' | 'REJECT' | 'WARN';
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

    duplicate: async (id: number | string, name: string) => {
        const response = await apiClient.post<PriceList>(`/api/v1/price-lists/${id}/duplicate`, { name });
        return response.data;
    },

    bulkAdjustPrices: async (
        id: number | string,
        adjustmentType: 'percentage' | 'multiplier',
        adjustmentValue: number,
        roundingType?: 'nearest_10' | 'whole_number',
        itemIds?: number[]
    ) => {
        const response = await apiClient.post<{
            message: string;
            updated_count: number;
            sample_items: Array<{
                id: number;
                name: string;
                old_price: number;
                new_price: number;
            }>;
        }>(`/api/v1/price-lists/${id}/items/bulk-adjust-prices`, {
            adjustment_type: adjustmentType,
            adjustment_value: adjustmentValue,
            rounding_type: roundingType || null,
            item_ids: itemIds || null,
        });
        return response.data;
    },

    bulkUpdateTaxService: async (
        id: number | string,
        itemIds: number[],
        taxInclusive?: boolean,
        serviceChargeInclusive?: boolean
    ) => {
        const response = await apiClient.post<{
            message: string;
            updated_count: number;
        }>(`/api/v1/price-lists/${id}/items/bulk-update-tax-service`, {
            item_ids: itemIds,
            tax_inclusive: taxInclusive !== undefined ? taxInclusive : null,
            service_charge_inclusive: serviceChargeInclusive !== undefined ? serviceChargeInclusive : null,
        });
        return response.data;
    },
};

