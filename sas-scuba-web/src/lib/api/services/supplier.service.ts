import apiClient from "../client";

export interface Supplier {
    id: number;
    dive_center_id: number;
    name: string;
    address?: string;
    contact_no?: string;
    email?: string;
    gst_tin?: string;
    currency: 'USD' | 'MVR';
    status: 'Active' | 'Suspended';
    created_at?: string;
    updated_at?: string;
}

export interface SupplierFormData {
    name: string;
    address?: string;
    contact_no?: string;
    email?: string;
    gst_tin?: string;
    currency?: 'USD' | 'MVR';
    status?: 'Active' | 'Suspended';
}

export const supplierService = {
    getAll: async (params?: { status?: string; search?: string }) => {
        const response = await apiClient.get<Supplier[]>("/api/v1/suppliers", { params });
        return response.data;
    },

    create: async (data: SupplierFormData) => {
        const response = await apiClient.post<Supplier>("/api/v1/suppliers", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Supplier>(`/api/v1/suppliers/${id}`);
        return response.data;
    },

    update: async (id: number, data: SupplierFormData) => {
        const response = await apiClient.put<Supplier>(`/api/v1/suppliers/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/suppliers/${id}`);
    }
};
