import apiClient from "../client";
import { Customer } from "./customer.service";
import { DiveSite } from "./dive-site.service";

export interface Boat {
    id: number;
    name: string;
    capacity?: number;
    active: boolean;
}

export interface User {
    id: number;
    full_name: string;
    email: string;
    role: string;
}

export interface DiveLog {
    id: number;
    dive_center_id: number;
    customer_id: number;
    dive_site_id: number;
    dive_date: string;
    entry_time: string;
    exit_time: string;
    total_dive_time?: number;
    max_depth: number;
    boat_id?: number;
    dive_type: 'Recreational' | 'Training' | 'Technical' | 'Night' | 'Wreck' | 'Cave' | 'Drift' | 'Other';
    instructor_id?: number;
    visibility?: number;
    visibility_unit: 'meters' | 'feet';
    current?: number;
    current_unit: 'knots' | 'm/s';
    tank_size?: number;
    tank_size_unit: 'liters' | 'cubic_feet';
    gas_mix: 'Air' | 'Nitrox' | 'Trimix';
    starting_pressure?: number;
    ending_pressure?: number;
    pressure_unit: 'bar' | 'psi';
    notes?: string;
    created_at: string;
    updated_at: string;
    customer?: Customer;
    dive_site?: DiveSite;
    boat?: Boat;
    instructor?: User;
}

export interface DiveLogFormData {
    customer_id: string | number;
    dive_site_id: string | number;
    dive_date: string;
    entry_time: string;
    exit_time: string;
    total_dive_time?: number;
    max_depth: number;
    boat_id?: string | number;
    dive_type: 'Recreational' | 'Training' | 'Technical' | 'Night' | 'Wreck' | 'Cave' | 'Drift' | 'Other';
    instructor_id?: string | number;
    visibility?: number;
    visibility_unit?: 'meters' | 'feet';
    current?: number;
    current_unit?: 'knots' | 'm/s';
    tank_size?: number;
    tank_size_unit?: 'liters' | 'cubic_feet';
    gas_mix: 'Air' | 'Nitrox' | 'Trimix';
    starting_pressure?: number;
    ending_pressure?: number;
    pressure_unit?: 'bar' | 'psi';
    notes?: string;
}

export interface PaginationParams {
    page?: number;
    per_page?: number;
    search?: string;
    customer_id?: number;
    date_from?: string;
    date_to?: string;
    dive_site_id?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
}

export const diveLogService = {
    getAll: async (params?: PaginationParams) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.customer_id) queryParams.append('customer_id', params.customer_id.toString());
        if (params?.date_from) queryParams.append('date_from', params.date_from);
        if (params?.date_to) queryParams.append('date_to', params.date_to);
        if (params?.dive_site_id) queryParams.append('dive_site_id', params.dive_site_id.toString());
        
        const response = await apiClient.get<PaginatedResponse<DiveLog>>(`/api/v1/dive-logs?${queryParams.toString()}`);
        return response.data;
    },

    create: async (data: DiveLogFormData) => {
        const response = await apiClient.post<DiveLog>("/api/v1/dive-logs", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<DiveLog>(`/api/v1/dive-logs/${id}`);
        return response.data;
    },

    update: async (id: number, data: Partial<DiveLogFormData>) => {
        const response = await apiClient.put<DiveLog>(`/api/v1/dive-logs/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/dive-logs/${id}`);
    },

    getByCustomer: async (customerId: string | number, params?: PaginationParams) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
        if (params?.date_from) queryParams.append('date_from', params.date_from);
        if (params?.date_to) queryParams.append('date_to', params.date_to);
        
        const response = await apiClient.get<PaginatedResponse<DiveLog>>(`/api/v1/customers/${customerId}/dive-logs?${queryParams.toString()}`);
        return response.data;
    }
};



