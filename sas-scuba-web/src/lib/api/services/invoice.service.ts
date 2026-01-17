import apiClient from "../client";
import { Booking } from "./booking.service";
import { BookingDive } from "./booking-dive.service";
import { PriceListItem } from "./price-list.service";
import { Payment } from "./payment.service";

export interface InvoiceItem {
    id: number;
    invoice_id: number;
    price_list_item_id?: number;
    booking_dive_id?: number;
    booking_equipment_id?: number;
    booking_excursion_id?: number;
    description?: string;
    quantity: number;
    unit_price: number;
    discount?: number;
    total: number;
    booking_dive?: BookingDive;
    booking_equipment?: any;
    booking_excursion?: any;
    price_list_item?: PriceListItem;
}

export interface Invoice {
    id: number;
    dive_center_id: number;
    booking_id?: number;
    customer_id?: number;
    booking?: Booking;
    customer?: any;
    invoice_no?: string;
    invoice_date?: string;
    subtotal?: number;
    tax?: number;
    service_charge?: number;
    discount?: number;
    total?: number;
    currency?: string;
    status: 'Draft' | 'Paid' | 'Partially Paid' | 'Refunded';
    invoice_type?: 'Advance' | 'Final' | 'Full';
    related_invoice_id?: number;
    related_invoice?: Invoice;
    invoice_items?: InvoiceItem[];
    payments?: Payment[];
    created_at: string;
    updated_at: string;
}

export interface GenerateInvoiceRequest {
    booking_id: number;
    invoice_type?: 'Advance' | 'Final' | 'Full';
    include_dives?: boolean;
    include_equipment?: boolean;
    include_excursions?: boolean;
    tax_percentage?: number;
}

export interface InvoiceFilters {
    status?: string;
    customer_id?: number;
    invoice_type?: string;
}

export interface AddInvoiceItemRequest {
    description: string;
    quantity: number;
    unit_price: number;
    discount?: number;
    price_list_item_id?: number;
    booking_dive_id?: number;
    booking_equipment_id?: number;
}

export const invoiceService = {
    getAll: async (filters?: InvoiceFilters, page = 1) => {
        const params = new URLSearchParams();
        if (filters?.status) {
            params.append('status', filters.status);
        }
        if (filters?.customer_id) {
            params.append('customer_id', filters.customer_id.toString());
        }
        if (filters?.invoice_type) {
            params.append('invoice_type', filters.invoice_type);
        }
        params.append('page', page.toString());
        const queryString = params.toString();
        const url = `/api/v1/invoices${queryString ? `?${queryString}` : ''}`;
        const response = await apiClient.get<{ data: Invoice[]; meta: any }>(url);
        return response.data;
    },

    create: async (data: { booking_id?: number; customer_id?: number; invoice_type?: string; invoice_date?: string; tax_percentage?: number }) => {
        const response = await apiClient.post<Invoice>("/api/v1/invoices", data);
        return response.data;
    },

    generateFromBooking: async (data: GenerateInvoiceRequest) => {
        const response = await apiClient.post<Invoice>("/api/v1/invoices/generate-from-booking", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Invoice>(`/api/v1/invoices/${id}`);
        return response.data;
    },

    update: async (id: number, data: Partial<Invoice>) => {
        const response = await apiClient.put<Invoice>(`/api/v1/invoices/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/invoices/${id}`);
    },

    addItem: async (invoiceId: number, data: AddInvoiceItemRequest) => {
        const response = await apiClient.post<Invoice>(`/api/v1/invoices/${invoiceId}/add-item`, data);
        return response.data;
    },

    deleteItem: async (invoiceId: number, itemId: number) => {
        const response = await apiClient.delete<Invoice>(`/api/v1/invoices/${invoiceId}/items/${itemId}`);
        return response.data;
    },
};

