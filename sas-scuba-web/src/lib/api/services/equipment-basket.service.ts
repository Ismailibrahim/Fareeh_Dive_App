import apiClient from "../client";
import { Customer } from "./customer.service";
import { Booking } from "./booking.service";
import { BookingEquipment, DamageInfo } from "./booking-equipment.service";

export interface EquipmentBasket {
    id: number;
    dive_center_id: number;
    customer_id: number;
    booking_id?: number;
    basket_no: string;
    center_bucket_no?: string;
    checkout_date?: string;
    expected_return_date?: string;
    actual_return_date?: string;
    status: 'Active' | 'Returned' | 'Lost';
    notes?: string;
    customer?: Customer;
    booking?: Booking;
    booking_equipment?: BookingEquipment[];
    created_at: string;
    updated_at: string;
}

export interface CreateBasketRequest {
    customer_id: number;
    booking_id?: number;
    center_bucket_no?: string;
    expected_return_date?: string;
    notes?: string;
}

export interface EquipmentBasketFilters {
    status?: string;
    customer_id?: number;
}

export const equipmentBasketService = {
    create: async (data: CreateBasketRequest) => {
        const response = await apiClient.post<EquipmentBasket>("/api/v1/equipment-baskets", data);
        return response.data;
    },

    getAll: async (filters?: EquipmentBasketFilters) => {
        const params = new URLSearchParams();
        if (filters?.status) {
            params.append('status', filters.status);
        }
        if (filters?.customer_id) {
            params.append('customer_id', filters.customer_id.toString());
        }
        const queryString = params.toString();
        const url = `/api/v1/equipment-baskets${queryString ? `?${queryString}` : ''}`;
        const response = await apiClient.get<{ data: EquipmentBasket[]; meta: any }>(url);
        return response.data;
    },

    getById: async (id: number) => {
        const response = await apiClient.get<EquipmentBasket>(`/api/v1/equipment-baskets/${id}`);
        return response.data;
    },

    returnBasket: async (id: number, options?: {
        equipment_ids?: number[];
        damage_info?: { [equipment_id: number]: DamageInfo };
    }) => {
        const response = await apiClient.put<EquipmentBasket>(`/api/v1/equipment-baskets/${id}/return`, options || {});
        return response.data;
    },

    update: async (id: number, data: Partial<EquipmentBasket>) => {
        const response = await apiClient.put<EquipmentBasket>(`/api/v1/equipment-baskets/${id}`, data);
        return response.data;
    },
};

