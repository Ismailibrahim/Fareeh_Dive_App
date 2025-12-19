import apiClient from "../client";

export interface User {
    id: number;
    full_name: string;
    email: string;
    phone?: string;
    role: string;
    active: boolean;
}

export interface Instructor {
    id: number;
    user_id: number;
    instructor_number?: string;
    certification_agency?: string;
    certification_level?: string;
    certification_date?: string;
    certification_expiry?: string;
    instructor_status: 'Active' | 'Suspended' | 'Expired';
    specializations?: string[];
    languages_spoken?: string[];
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    address?: string;
    nationality?: string;
    passport_number?: string;
    availability_status: 'Available' | 'Unavailable' | 'On Leave';
    preferred_dive_times?: string[];
    max_dives_per_day?: number;
    medical_certificate_expiry?: string;
    insurance_provider?: string;
    insurance_provider_contact_no?: string;
    insurance_type?: string;
    insurance_policy_number?: string;
    insurance_expiry?: string;
    years_of_experience?: number;
    total_dives_logged?: number;
    total_students_certified?: number;
    bio?: string;
    profile_photo_url?: string;
    certificate_file_url?: string;
    insurance_file_url?: string;
    contract_file_url?: string;
    notes?: string;
    hired_date?: string;
    last_evaluation_date?: string;
    performance_rating?: number;
    created_at: string;
    updated_at: string;
    user?: User;
}

export interface InstructorFormData {
    user_id?: number;
    // User fields (if creating new user)
    full_name?: string;
    email?: string;
    password?: string;
    phone?: string;
    // Instructor fields
    instructor_number?: string;
    certification_agency?: string;
    certification_level?: string;
    certification_date?: string;
    certification_expiry?: string;
    instructor_status?: 'Active' | 'Suspended' | 'Expired';
    specializations?: string[];
    languages_spoken?: string[];
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    address?: string;
    nationality?: string;
    passport_number?: string;
    availability_status?: 'Available' | 'Unavailable' | 'On Leave';
    preferred_dive_times?: string[];
    max_dives_per_day?: number;
    medical_certificate_expiry?: string;
    insurance_provider?: string;
    insurance_provider_contact_no?: string;
    insurance_type?: string;
    insurance_policy_number?: string;
    insurance_expiry?: string;
    years_of_experience?: number;
    total_dives_logged?: number;
    total_students_certified?: number;
    bio?: string;
    profile_photo_url?: string;
    certificate_file_url?: string;
    insurance_file_url?: string;
    contract_file_url?: string;
    notes?: string;
    hired_date?: string;
    last_evaluation_date?: string;
    performance_rating?: number;
}

export const instructorService = {
    getAll: async (page = 1, params?: { instructor_status?: string; availability_status?: string }) => {
        const queryParams = new URLSearchParams({ page: page.toString() });
        if (params?.instructor_status) queryParams.append('instructor_status', params.instructor_status);
        if (params?.availability_status) queryParams.append('availability_status', params.availability_status);
        
        const response = await apiClient.get<{ data: Instructor[]; meta: any }>(`/api/v1/instructors?${queryParams}`);
        return response.data;
    },

    create: async (data: InstructorFormData) => {
        const response = await apiClient.post<Instructor>("/api/v1/instructors", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Instructor>(`/api/v1/instructors/${id}`);
        return response.data;
    },

    update: async (id: number, data: InstructorFormData) => {
        const response = await apiClient.put<Instructor>(`/api/v1/instructors/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/instructors/${id}`);
    }
};

