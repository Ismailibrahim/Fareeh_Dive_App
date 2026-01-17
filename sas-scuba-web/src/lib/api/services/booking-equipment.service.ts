import apiClient from "../client";
import { Booking } from "./booking.service";
import { EquipmentItem } from "./equipment-item.service";
import { EquipmentBasket } from "./equipment-basket.service";

export interface BookingEquipment {
    id: number;
    booking_id: number;
    basket_id?: number;
    booking?: Booking;
    equipment_item_id?: number;
    equipment_item?: EquipmentItem;
    price: number;
    checkout_date?: string;
    return_date?: string;
    actual_return_date?: string;
    equipment_source: 'Center' | 'Customer Own';
    customer_equipment_type?: string;
    customer_equipment_brand?: string;
    customer_equipment_model?: string;
    customer_equipment_serial?: string;
    customer_equipment_notes?: string;
    assignment_status: 'Pending' | 'Checked Out' | 'Returned' | 'Lost';
    damage_reported?: boolean;
    damage_description?: string;
    damage_cost?: number;
    charge_customer?: boolean;
    damage_charge_amount?: number;
    basket?: EquipmentBasket;
    created_at?: string;
    updated_at?: string;
}

export interface BookingEquipmentFormData {
    booking_id?: number;
    basket_id?: number;
    equipment_item_id?: number;
    equipment_source: 'Center' | 'Customer Own';
    checkout_date?: string;
    return_date?: string;
    price?: number;
    customer_equipment_type?: string;
    customer_equipment_brand?: string;
    customer_equipment_model?: string;
    customer_equipment_serial?: string;
    customer_equipment_notes?: string;
}

export interface AvailabilityCheckRequest {
    equipment_item_id: number;
    checkout_date: string;
    return_date: string;
}

export interface AvailabilityCheckResponse {
    available: boolean;
    conflicting_assignments?: Array<{
        id: number;
        customer_name: string;
        checkout_date: string;
        return_date: string;
    }>;
}

export interface DamageInfo {
    damage_reported: boolean;
    damage_description?: string;
    damage_cost?: number;
    charge_customer?: boolean;
    damage_charge_amount?: number;
}

export interface BulkReturnRequest {
    equipment_ids: number[];
    damage_info?: { [equipment_id: number]: DamageInfo };
}

export interface BulkCreateRequest {
    items: BookingEquipmentFormData[];
}

export interface BulkCreateResponse {
    message: string;
    success_count: number;
    failed_count: number;
    success: BookingEquipment[];
    failed: Array<{
        index: number;
        item: BookingEquipmentFormData;
        error: string;
        equipment_item_id?: number;
        checkout_date?: string;
        return_date?: string;
        conflicting_assignments?: Array<{
            id: number;
            customer_name: string;
            checkout_date: string;
            return_date: string;
            basket_no?: string;
            assignment_status: string;
        }>;
    }>;
}

export interface BulkAvailabilityCheckRequest {
    items: AvailabilityCheckRequest[];
}

export interface BulkAvailabilityCheckResponse {
    results: Array<{
        index: number;
        equipment_item_id: number;
        checkout_date: string;
        return_date: string;
        available: boolean;
        conflicting_assignments?: Array<{
            id: number;
            customer_name: string;
            checkout_date: string;
            return_date: string;
            basket_no?: string;
            assignment_status: string;
        }>;
    }>;
}

export const bookingEquipmentService = {
    getAll: async (page = 1) => {
        const response = await apiClient.get<{ data: BookingEquipment[]; meta: any }>(`/api/v1/booking-equipment?page=${page}`);
        return response.data;
    },

    create: async (data: BookingEquipmentFormData) => {
        const response = await apiClient.post<BookingEquipment>("/api/v1/booking-equipment", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<BookingEquipment>(`/api/v1/booking-equipment/${id}`);
        return response.data;
    },

    update: async (id: number, data: Partial<BookingEquipmentFormData>) => {
        const response = await apiClient.put<BookingEquipment>(`/api/v1/booking-equipment/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/booking-equipment/${id}`);
    },

    checkAvailability: async (data: AvailabilityCheckRequest): Promise<AvailabilityCheckResponse> => {
        const response = await apiClient.post<AvailabilityCheckResponse>("/api/v1/booking-equipment/check-availability", data);
        return response.data;
    },

    returnEquipment: async (id: number, damageInfo?: DamageInfo) => {
        const response = await apiClient.put<BookingEquipment>(`/api/v1/booking-equipment/${id}/return`, damageInfo || {});
        return response.data;
    },

    bulkReturn: async (data: BulkReturnRequest) => {
        const response = await apiClient.post<{ message: string; equipment: BookingEquipment[] }>("/api/v1/booking-equipment/bulk-return", data);
        return response.data;
    },

    bulkCreate: async (data: BulkCreateRequest): Promise<BulkCreateResponse> => {
        const response = await apiClient.post<BulkCreateResponse>("/api/v1/booking-equipment/bulk", data);
        return response.data;
    },

    bulkCheckAvailability: async (data: BulkAvailabilityCheckRequest): Promise<BulkAvailabilityCheckResponse> => {
        const response = await apiClient.post<BulkAvailabilityCheckResponse>("/api/v1/booking-equipment/bulk-check-availability", data);
        return response.data;
    },
};

