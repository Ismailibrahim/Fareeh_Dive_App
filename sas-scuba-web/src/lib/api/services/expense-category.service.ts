import apiClient from "../client";

export interface ExpenseCategory {
    id: number;
    dive_center_id: number;
    name: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ExpenseCategoryFormData {
    name: string;
    description?: string;
}

export const expenseCategoryService = {
    getAll: async () => {
        const response = await apiClient.get<ExpenseCategory[]>("/api/v1/expense-categories");
        return response.data;
    },

    create: async (data: ExpenseCategoryFormData) => {
        const response = await apiClient.post<ExpenseCategory>("/api/v1/expense-categories", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<ExpenseCategory>(`/api/v1/expense-categories/${id}`);
        return response.data;
    },

    update: async (id: number, data: ExpenseCategoryFormData) => {
        const response = await apiClient.put<ExpenseCategory>(`/api/v1/expense-categories/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/expense-categories/${id}`);
    }
};