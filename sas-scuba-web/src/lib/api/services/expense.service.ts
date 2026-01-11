import apiClient from "../client";
import { Supplier } from "./supplier.service";
import { ExpenseCategory } from "./expense-category.service";

export interface User {
    id: number;
    full_name: string;
    email: string;
}

export interface Expense {
    id: number;
    dive_center_id: number;
    supplier_id: number;
    expense_category_id: number;
    created_by?: number;
    expense_no?: string;
    expense_date: string;
    description: string;
    amount: number;
    currency: string;
    is_recurring: boolean;
    recurring_period?: 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
    notes?: string;
    supplier?: Supplier;
    expense_category?: ExpenseCategory;
    created_by_user?: User;
    created_at?: string;
    updated_at?: string;
}

export interface ExpenseFormData {
    supplier_id: number;
    expense_category_id: number;
    expense_date: string;
    description: string;
    amount: number;
    currency: string;
    is_recurring?: boolean;
    recurring_period?: 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
    notes?: string;
}

export interface ExpenseFilters {
    date_from?: string;
    date_to?: string;
    amount_min?: number;
    amount_max?: number;
    expense_category_id?: number;
    supplier_id?: number;
    currency?: string;
    is_recurring?: boolean;
    search?: string;
    page?: number;
    per_page?: number;
}

export const expenseService = {
    getAll: async (filters?: ExpenseFilters) => {
        const params = new URLSearchParams();
        
        if (filters?.date_from) {
            params.append('date_from', filters.date_from);
        }
        if (filters?.date_to) {
            params.append('date_to', filters.date_to);
        }
        if (filters?.amount_min !== undefined) {
            params.append('amount_min', filters.amount_min.toString());
        }
        if (filters?.amount_max !== undefined) {
            params.append('amount_max', filters.amount_max.toString());
        }
        if (filters?.expense_category_id) {
            params.append('expense_category_id', filters.expense_category_id.toString());
        }
        if (filters?.supplier_id) {
            params.append('supplier_id', filters.supplier_id.toString());
        }
        if (filters?.currency) {
            params.append('currency', filters.currency);
        }
        if (filters?.is_recurring !== undefined) {
            params.append('is_recurring', filters.is_recurring.toString());
        }
        if (filters?.search) {
            params.append('search', filters.search);
        }
        if (filters?.page) {
            params.append('page', filters.page.toString());
        }
        if (filters?.per_page) {
            params.append('per_page', filters.per_page.toString());
        }
        
        const queryString = params.toString();
        const url = `/api/v1/expenses${queryString ? `?${queryString}` : ''}`;
        const response = await apiClient.get<{ data: Expense[]; meta: any }>(url);
        return response.data;
    },

    create: async (data: ExpenseFormData) => {
        const response = await apiClient.post<Expense>("/api/v1/expenses", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Expense>(`/api/v1/expenses/${id}`);
        return response.data;
    },

    update: async (id: number, data: ExpenseFormData) => {
        const response = await apiClient.put<Expense>(`/api/v1/expenses/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/expenses/${id}`);
    }
};