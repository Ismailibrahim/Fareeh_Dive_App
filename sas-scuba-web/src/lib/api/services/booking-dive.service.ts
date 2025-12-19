import apiClient from "../client";
import { Booking } from "./booking.service";

export interface PriceListItem {
    id: number;
    price_list_id: number;
    service_type: string;
    name: string;
    description?: string;
    price: number;
    unit?: string;
    tax_percentage?: number;
    is_active: boolean;
}

export interface DivePackage {
    id: number;
    package_total_dives: number;
    package_dives_used: number;
    status: string;
}

export interface BookingDive {
    id: number;
    booking_id: number;
    booking?: Booking;
    dive_site_id: number;
    dive_site?: {
        id: number;
        name: string;
    };
    boat_id?: number;
    boat?: {
        id: number;
        name: string;
    };
    dive_date?: string;
    dive_time?: string;
    price_list_item_id?: number;
    price?: number;
    price_list_item?: PriceListItem;
    dive_duration?: number;
    max_depth?: number;
    status?: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
    completed_at?: string;
    dive_log_notes?: string;
    dive_package_id?: number;
    is_package_dive?: boolean;
    package_dive_number?: number;
    dive_package?: DivePackage;
    instructors?: Array<{
        id: number;
        user_id: number;
        user: {
            full_name: string;
        };
        role: string;
    }>;
    created_at: string;
    updated_at: string;
}

export interface BookingDiveFormData {
    booking_id?: number;
    customer_id?: number;
    booking_date?: string;
    number_of_divers?: number;
    dive_site_id: number;
    boat_id?: number;
    dive_date?: string;
    dive_time?: string;
    price_list_item_id?: number;
    price?: number;
    dive_duration?: number;
    max_depth?: number;
    status?: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
    completed_at?: string;
    dive_log_notes?: string;
}

export const bookingDiveService = {
    getAll: async (page = 1) => {
        const response = await apiClient.get<{ data: BookingDive[]; meta: any }>(`/api/v1/booking-dives?page=${page}`);
        return response.data;
    },

    create: async (data: BookingDiveFormData) => {
        const response = await apiClient.post<BookingDive>("/api/v1/booking-dives", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<BookingDive>(`/api/v1/booking-dives/${id}`);
        return response.data;
    },

    update: async (id: number, data: Partial<BookingDiveFormData>) => {
        const response = await apiClient.put<BookingDive>(`/api/v1/booking-dives/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/booking-dives/${id}`);
    },

    complete: async (id: number, data?: { dive_duration?: number; max_depth?: number; dive_log_notes?: string }) => {
        const response = await apiClient.post<BookingDive>(`/api/v1/booking-dives/${id}/complete`, data || {});
        return response.data;
    },

    getLog: async (id: number) => {
        const response = await apiClient.get<{ dive: BookingDive; log: any }>(`/api/v1/booking-dives/${id}/log`);
        return response.data;
    }
};

