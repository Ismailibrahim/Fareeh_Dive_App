import apiClient from "../client";
import { Customer } from "./customer.service";
import { DiveGroup } from "./dive-group.service";

export interface Booking {
    id: number;
    dive_center_id: number;
    customer_id: number;
    customer?: Customer;
    dive_group_id?: number;
    dive_group?: DiveGroup;
    booking_date?: string;
    start_date?: string;
    number_of_divers?: number;
    dive_site_id?: number;
    dive_site?: any;
    status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface BookingFormData {
    dive_center_id: number;
    customer_id: number;
    start_date: string;
    number_of_divers?: number;
    dive_site_id?: number;
    status?: "Pending" | "Confirmed" | "Completed" | "Cancelled";
    notes?: string;
}

export interface PaginationParams {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from?: number;
    to?: number;
}

export const bookingService = {
    getAll: async (params?: PaginationParams) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', String(params.page));
        if (params?.per_page) queryParams.append('per_page', String(params.per_page));
        if (params?.search) queryParams.append('search', params.search);
        if (params?.status) queryParams.append('status', params.status);
        
        const queryString = queryParams.toString();
        const response = await apiClient.get<{ data: Booking[]; meta: any }>(`/api/v1/bookings${queryString ? `?${queryString}` : ''}`);
        return response.data;
    },

    create: async (data: BookingFormData) => {
        const response = await apiClient.post<Booking>("/api/v1/bookings", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Booking>(`/api/v1/bookings/${id}`);
        return response.data;
    },

    update: async (id: number, data: Partial<BookingFormData>) => {
        const response = await apiClient.put<Booking>(`/api/v1/bookings/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/bookings/${id}`);
    }
};

