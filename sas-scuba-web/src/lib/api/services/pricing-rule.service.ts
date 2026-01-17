import apiClient from "../client";
import { PricingRule, PricingRuleFormData } from "./price-list.service";

export interface PricingRuleFilters {
    is_active?: boolean;
    rule_type?: 'OVERLAP_HANDLING' | 'VALIDATION' | 'DISCOUNT' | 'SURCHARGE';
}

export const pricingRuleService = {
    getAll: async (filters?: PricingRuleFilters) => {
        const params = new URLSearchParams();
        if (filters?.is_active !== undefined) {
            params.append('is_active', filters.is_active.toString());
        }
        if (filters?.rule_type) {
            params.append('rule_type', filters.rule_type);
        }
        const queryString = params.toString();
        const url = `/api/v1/pricing-rules${queryString ? `?${queryString}` : ''}`;
        const response = await apiClient.get<PricingRule[]>(url);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<PricingRule>(`/api/v1/pricing-rules/${id}`);
        return response.data;
    },

    create: async (data: PricingRuleFormData) => {
        const response = await apiClient.post<PricingRule>("/api/v1/pricing-rules", data);
        return response.data;
    },

    update: async (id: number | string, data: Partial<PricingRuleFormData>) => {
        const response = await apiClient.put<PricingRule>(`/api/v1/pricing-rules/${id}`, data);
        return response.data;
    },

    delete: async (id: number | string) => {
        await apiClient.delete(`/api/v1/pricing-rules/${id}`);
    },
};

