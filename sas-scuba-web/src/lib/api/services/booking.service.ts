import apiClient from "../client";
import { Customer } from "./customer.service";

export interface Booking {
    id: number;
    dive_center_id: number;
    customer_id: number;
    customer?: Customer;
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

export const bookingService = {
    getAll: async (page = 1) => {
        const response = await apiClient.get<{ data: Booking[]; meta: any }>(`/api/v1/bookings?page=${page}`);
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

