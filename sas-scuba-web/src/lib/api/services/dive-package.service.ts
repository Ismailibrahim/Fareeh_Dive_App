import apiClient from "../client";
import { Customer } from "./customer.service";
import { PriceListItem } from "./price-list.service";
import { Booking } from "./booking.service";
import { BookingDive } from "./booking-dive.service";

export interface DivePackage {
    id: number;
    dive_center_id: number;
    customer_id: number;
    customer?: Customer;
    package_price_list_item_id: number;
    package_price_list_item?: PriceListItem;
    package_total_price: number;
    package_per_dive_price?: number;
    package_total_dives: number;
    package_dives_used: number;
    package_start_date: string;
    package_end_date?: string;
    package_duration_days: number;
    status: 'Active' | 'Completed' | 'Expired' | 'Cancelled';
    notes?: string;
    bookings?: Booking[];
    booking_dives?: BookingDive[];
    created_at: string;
    updated_at: string;
}

export interface DivePackageFormData {
    customer_id: number;
    package_price_list_item_id: number;
    package_total_price: number;
    package_per_dive_price?: number;
    package_total_dives: number;
    package_duration_days: number;
    package_start_date: string;
    package_end_date?: string;
    create_bookings_now?: boolean;
    notes?: string;
}

export interface DivePackageStatus {
    remaining_dives: number;
    total_dives: number;
    dives_used: number;
    is_active: boolean;
    can_add_dive: boolean;
    status: string;
    bookings_count: number;
    dives_scheduled: number;
}

export const divePackageService = {
    getAll: async (filters?: { status?: string; customer_id?: number }) => {
        const params = new URLSearchParams();
        if (filters?.status) {
            params.append('status', filters.status);
        }
        if (filters?.customer_id) {
            params.append('customer_id', filters.customer_id.toString());
        }
        const queryString = params.toString();
        const url = `/api/v1/dive-packages${queryString ? `?${queryString}` : ''}`;
        const response = await apiClient.get<{ data: DivePackage[]; meta: any }>(url);
        return response.data;
    },

    create: async (data: DivePackageFormData) => {
        const response = await apiClient.post<DivePackage>("/api/v1/dive-packages", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<DivePackage>(`/api/v1/dive-packages/${id}`);
        return response.data;
    },

    getStatus: async (id: number): Promise<DivePackageStatus> => {
        const response = await apiClient.get<DivePackageStatus>(`/api/v1/dive-packages/${id}/status`);
        return response.data;
    },

    update: async (id: number, data: Partial<DivePackageFormData>) => {
        const response = await apiClient.put<DivePackage>(`/api/v1/dive-packages/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/dive-packages/${id}`);
    },
};

