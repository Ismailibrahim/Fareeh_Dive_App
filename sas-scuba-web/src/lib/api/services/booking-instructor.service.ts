import apiClient from "../client";
import { BookingDive } from "./booking-dive.service";
import { User } from "./user.service";

export interface BookingInstructor {
    id: number;
    booking_dive_id: number;
    booking_dive?: BookingDive;
    user_id: number;
    user?: User;
    role?: string;
    created_at?: string;
    updated_at?: string;
}

export interface BookingInstructorFormData {
    booking_dive_id: number;
    user_id: number;
    role?: string;
}

export const bookingInstructorService = {
    getAll: async (page = 1) => {
        const response = await apiClient.get<{ data: BookingInstructor[]; meta: any }>(`/api/v1/booking-instructors?page=${page}`);
        return response.data;
    },

    create: async (data: BookingInstructorFormData) => {
        const response = await apiClient.post<BookingInstructor>("/api/v1/booking-instructors", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<BookingInstructor>(`/api/v1/booking-instructors/${id}`);
        return response.data;
    },

    update: async (id: number, data: Partial<BookingInstructorFormData>) => {
        const response = await apiClient.put<BookingInstructor>(`/api/v1/booking-instructors/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/booking-instructors/${id}`);
    }
};

