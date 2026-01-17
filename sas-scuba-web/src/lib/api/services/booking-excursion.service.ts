import apiClient from "../client";
import { Booking } from "./booking.service";
import { PriceListItem } from "./booking-dive.service";

export interface Excursion {
    id: number;
    name: string;
    description?: string;
    duration?: number;
    location?: string;
    capacity?: number;
    meeting_point?: string;
    departure_time?: string;
    is_active: boolean;
}

export interface BookingExcursion {
    id: number;
    booking_id: number;
    booking?: Booking;
    excursion_id: number;
    excursion?: Excursion;
    excursion_date?: string;
    excursion_time?: string;
    price_list_item_id?: number;
    price?: number;
    price_list_item?: PriceListItem;
    status?: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
    completed_at?: string;
    notes?: string;
    number_of_participants?: number;
    created_at: string;
    updated_at: string;
}

export interface BookingExcursionFormData {
    booking_id?: number;
    customer_id?: number;
    dive_group_id?: number;
    booking_date?: string;
    number_of_participants?: number;
    excursion_id: number;
    excursion_date?: string;
    excursion_time?: string;
    price_list_item_id?: number;
    price?: number;
    status?: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
    completed_at?: string;
    notes?: string;
}

export const bookingExcursionService = {
    getAll: async (page = 1) => {
        const response = await apiClient.get<{ data: BookingExcursion[]; meta: any }>(`/api/v1/booking-excursions?page=${page}`);
        return response.data;
    },

    create: async (data: BookingExcursionFormData) => {
        const response = await apiClient.post<BookingExcursion>("/api/v1/booking-excursions", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<BookingExcursion>(`/api/v1/booking-excursions/${id}`);
        return response.data;
    },

    update: async (id: number, data: Partial<BookingExcursionFormData>) => {
        const response = await apiClient.put<BookingExcursion>(`/api/v1/booking-excursions/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/booking-excursions/${id}`);
    },

    complete: async (id: number, data?: { notes?: string }) => {
        const response = await apiClient.post<BookingExcursion>(`/api/v1/booking-excursions/${id}/complete`, data || {});
        return response.data;
    }
};
