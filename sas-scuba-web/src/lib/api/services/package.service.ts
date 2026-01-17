import apiClient from "../client";

export interface PackageComponent {
    id: number;
    package_id: number;
    component_type: 'TRANSFER' | 'ACCOMMODATION' | 'DIVE' | 'EXCURSION' | 'MEAL' | 'EQUIPMENT' | 'OTHER';
    name: string;
    description?: string;
    item_id?: number;
    unit_price: number;
    quantity: number;
    unit: string;
    total_price: number;
    is_inclusive: boolean;
    sort_order: number;
}

export interface PackageOption {
    id: number;
    package_id: number;
    name: string;
    description?: string;
    item_id?: number;
    price: number;
    unit?: string;
    is_active: boolean;
    max_quantity?: number;
    sort_order: number;
}

export interface PackagePricingTier {
    id: number;
    package_id: number;
    min_persons: number;
    max_persons?: number;
    price_per_person: number;
    discount_percentage: number;
    is_active: boolean;
}

export interface Package {
    id: number;
    dive_center_id: number;
    package_code: string;
    name: string;
    description?: string;
    nights: number;
    days: number;
    total_dives: number;
    base_price: number;
    price_per_person: number;
    currency: string;
    is_active: boolean;
    sort_order: number;
    valid_from?: string;
    valid_until?: string;
    created_at: string;
    updated_at: string;
    components?: PackageComponent[];
    options?: PackageOption[];
    pricing_tiers?: PackagePricingTier[];
}

export interface PackageFormData {
    package_code: string;
    name: string;
    description?: string;
    nights?: number;
    days?: number;
    total_dives?: number;
    base_price: number;
    price_per_person: number;
    currency?: string;
    is_active?: boolean;
    sort_order?: number;
    valid_from?: string;
    valid_until?: string;
    components?: Omit<PackageComponent, 'id' | 'package_id'>[];
    options?: Omit<PackageOption, 'id' | 'package_id'>[];
    pricing_tiers?: Omit<PackagePricingTier, 'id' | 'package_id'>[];
}

export interface PackageBreakdown {
    package: {
        id: number;
        package_code: string;
        name: string;
        nights: number;
        days: number;
        total_dives: number;
        price_per_person: number;
        base_price: number;
    };
    breakdown: Array<{
        type: string;
        name: string;
        description: string;
        unit_price: number | null;
        quantity: number | null;
        unit: string;
        total: number | null;
    }>;
    total_price: number;
}

export interface PriceCalculationRequest {
    persons: number;
    option_ids?: number[];
}

export interface PriceCalculationResponse {
    package_id: number;
    persons: number;
    option_ids: number[];
    total_price: number;
}

export const packageService = {
    getAll: async (filters?: { is_active?: boolean; search?: string }) => {
        const params = new URLSearchParams();
        if (filters?.is_active !== undefined) {
            params.append('is_active', filters.is_active.toString());
        }
        if (filters?.search) {
            params.append('search', filters.search);
        }
        const queryString = params.toString();
        const url = `/api/v1/packages${queryString ? `?${queryString}` : ''}`;
        const response = await apiClient.get<{ data: Package[]; meta: any }>(url);
        return response.data;
    },

    create: async (data: PackageFormData) => {
        const response = await apiClient.post<Package>("/api/v1/packages", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Package>(`/api/v1/packages/${id}`);
        return response.data;
    },

    update: async (id: number, data: Partial<PackageFormData>) => {
        const response = await apiClient.put<Package>(`/api/v1/packages/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/packages/${id}`);
    },

    getBreakdown: async (id: number): Promise<PackageBreakdown> => {
        const response = await apiClient.get<PackageBreakdown>(`/api/v1/packages/${id}/breakdown`);
        return response.data;
    },

    calculatePrice: async (id: number, data: PriceCalculationRequest): Promise<PriceCalculationResponse> => {
        const response = await apiClient.post<PriceCalculationResponse>(`/api/v1/packages/${id}/calculate`, data);
        return response.data;
    },
};

