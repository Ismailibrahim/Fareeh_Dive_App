import apiClient from "../client";
import { Customer } from "./customer.service";
import { Package } from "./package.service";

export interface PackageBooking {
    id: number;
    booking_number: string;
    package_id: number;
    customer_id: number;
    dive_center_id: number;
    persons_count: number;
    start_date: string;
    end_date: string;
    total_price: number;
    status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED' | 'COMPLETED';
    notes?: string;
    created_at: string;
    updated_at: string;
    package?: Package;
    customer?: Customer;
}

export interface PackageBookingFormData {
    package_id: number;
    customer_id: number;
    persons_count: number;
    start_date: string;
    end_date?: string;
    option_ids?: number[];
    status?: 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED' | 'COMPLETED';
    notes?: string;
}

export interface PackageBookingPriceCalculation {
    package_id: number;
    persons_count: number;
    option_ids: number[];
    total_price: number;
}

export interface CreateBookingsResponse {
    message: string;
    bookings: Array<{
        id: number;
        dive_center_id: number;
        customer_id: number;
        booking_date: string;
        status: string;
        number_of_divers: number;
        notes: string;
    }>;
    count: number;
}

export const packageBookingService = {
    getAll: async (filters?: { status?: string; package_id?: number; customer_id?: number }) => {
        const params = new URLSearchParams();
        if (filters?.status) {
            params.append('status', filters.status);
        }
        if (filters?.package_id) {
            params.append('package_id', filters.package_id.toString());
        }
        if (filters?.customer_id) {
            params.append('customer_id', filters.customer_id.toString());
        }
        const queryString = params.toString();
        const url = `/api/v1/package-bookings${queryString ? `?${queryString}` : ''}`;
        const response = await apiClient.get<{ data: PackageBooking[]; meta: any }>(url);
        return response.data;
    },

    create: async (data: PackageBookingFormData) => {
        const response = await apiClient.post<PackageBooking>("/api/v1/package-bookings", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<PackageBooking>(`/api/v1/package-bookings/${id}`);
        return response.data;
    },

    update: async (id: number, data: Partial<PackageBookingFormData>) => {
        const response = await apiClient.put<PackageBooking>(`/api/v1/package-bookings/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/package-bookings/${id}`);
    },

    calculatePrice: async (data: { package_id: number; persons_count: number; option_ids?: number[] }): Promise<PackageBookingPriceCalculation> => {
        const response = await apiClient.post<PackageBookingPriceCalculation>("/api/v1/package-bookings/calculate", data);
        return response.data;
    },

    createBookings: async (id: number, createPerDay: boolean = true): Promise<CreateBookingsResponse> => {
        const response = await apiClient.post<CreateBookingsResponse>(`/api/v1/package-bookings/${id}/create-bookings`, {
            create_per_day: createPerDay,
        });
        return response.data;
    },
};

