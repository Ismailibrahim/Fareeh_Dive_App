import apiClient from "../client";
import { Invoice } from "./invoice.service";

export interface Payment {
    id: number;
    invoice_id: number;
    invoice?: Invoice;
    payment_date: string;
    amount: number;
    payment_type: 'Advance' | 'Final' | 'Refund';
    method: 'Cash' | 'Card' | 'Bank'; // Deprecated, kept for backward compatibility
    reference?: string; // Deprecated, kept for backward compatibility
    payment_method_id?: number;
    method_type?: 'Bank Transfer' | 'Crypto' | 'Credit Card' | 'Wallet' | 'Cash';
    method_subtype?: string;
    // Bank Transfer fields
    tt_reference?: string;
    account_no?: string;
    bank_name?: string;
    // Crypto fields
    crypto_type?: string;
    transaction_link?: string;
    // Credit Card fields
    card_type?: string;
    reference_number?: string;
    // Wallet fields
    wallet_type?: string;
    // Cash fields
    currency?: string;
    created_at: string;
    updated_at: string;
}

export interface PaymentFormData {
    invoice_id: number;
    amount: number;
    payment_type: 'Advance' | 'Final' | 'Refund';
    payment_date?: string;
    method?: 'Cash' | 'Card' | 'Bank'; // Deprecated, kept for backward compatibility
    reference?: string; // Deprecated, kept for backward compatibility
    payment_method_id?: number;
    method_type?: 'Bank Transfer' | 'Crypto' | 'Credit Card' | 'Wallet' | 'Cash';
    method_subtype?: string;
    // Bank Transfer fields
    tt_reference?: string;
    account_no?: string;
    bank_name?: string;
    // Crypto fields
    crypto_type?: string;
    transaction_link?: string;
    // Credit Card fields
    card_type?: string;
    reference_number?: string;
    // Wallet fields
    wallet_type?: string;
    // Cash fields
    currency?: string;
}

export const paymentService = {
    getAll: async (invoiceId?: number) => {
        const params = new URLSearchParams();
        if (invoiceId) {
            params.append('invoice_id', invoiceId.toString());
        }
        const queryString = params.toString();
        const url = `/api/v1/payments${queryString ? `?${queryString}` : ''}`;
        const response = await apiClient.get<{ data: Payment[]; meta: any }>(url);
        return response.data;
    },

    create: async (data: PaymentFormData) => {
        const response = await apiClient.post<Payment>("/api/v1/payments", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Payment>(`/api/v1/payments/${id}`);
        return response.data;
    },

    update: async (id: number, data: Partial<PaymentFormData>) => {
        const response = await apiClient.put<Payment>(`/api/v1/payments/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/payments/${id}`);
    },
};

