import apiClient from "../client";
import axios from "axios";

// Separate client for public endpoints (no authentication)
const publicApiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: false,
});

export interface PreRegistrationLink {
    id: number;
    token: string;
    url: string;
    expires_at: string;
    created_at: string;
    is_expired?: boolean;
}

export interface PreRegistrationSubmission {
    id: number;
    token: string;
    status: 'pending' | 'approved' | 'rejected';
    customer_name: string;
    customer_email?: string;
    submitted_at: string;
    reviewed_at?: string;
    reviewed_by?: {
        id: number;
        name: string;
    };
    expires_at: string;
}

export interface PreRegistrationSubmissionDetail extends PreRegistrationSubmission {
    customer_data: {
        full_name: string;
        email?: string;
        phone?: string;
        address?: string;
        city?: string;
        zip_code?: string;
        country?: string;
        passport_no?: string;
        date_of_birth?: string;
        gender?: string;
        nationality?: string;
        departure_date?: string;
        departure_flight?: string;
        departure_flight_time?: string;
        departure_to?: string;
    };
    emergency_contacts_data?: Array<{
        name?: string;
        email?: string;
        phone_1?: string;
        phone_2?: string;
        phone_3?: string;
        address?: string;
        relationship?: string;
        is_primary?: boolean;
    }>;
    certifications_data?: Array<{
        certification_name: string;
        certification_no?: string;
        certification_date: string;
        last_dive_date?: string;
        no_of_dives?: number;
        agency?: string;
        instructor?: string;
        file_url?: string;
        license_status?: boolean;
    }>;
    insurance_data?: {
        insurance_provider?: string;
        insurance_no?: string;
        insurance_hotline_no?: string;
        file_url?: string;
        expiry_date?: string;
        status?: boolean;
    };
    accommodation_data?: {
        name?: string;
        address?: string;
        contact_no?: string;
        island?: string;
        room_no?: string;
    };
    review_notes?: string;
    created_customer_id?: number;
    created_at: string;
}

export interface PreRegistrationFormData {
    customer: {
        full_name: string;
        email?: string;
        phone?: string;
        address?: string;
        city?: string;
        zip_code?: string;
        country?: string;
        passport_no?: string;
        date_of_birth?: string;
        gender?: string;
        nationality?: string;
        departure_date?: string;
        departure_flight?: string;
        departure_flight_time?: string;
        departure_to?: string;
    };
    emergency_contacts?: Array<{
        name?: string;
        email?: string;
        phone_1?: string;
        phone_2?: string;
        phone_3?: string;
        address?: string;
        relationship?: string;
        is_primary?: boolean;
    }>;
    certifications?: Array<{
        certification_name: string;
        certification_no?: string;
        certification_date: string;
        last_dive_date?: string;
        no_of_dives?: number;
        agency?: string;
        instructor?: string;
        file_url?: string;
        license_status?: boolean;
    }>;
    insurance?: {
        insurance_provider?: string;
        insurance_no?: string;
        insurance_hotline_no?: string;
        file_url?: string;
        expiry_date?: string;
        status?: boolean;
    };
    accommodation?: {
        name?: string;
        address?: string;
        contact_no?: string;
        island?: string;
        room_no?: string;
    };
}

export interface PreRegistrationTokenResponse {
    token: string;
    expires_at: string;
    dive_center: {
        id: number;
        name: string;
    };
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

export interface BulkLinksResponse {
    message: string;
    links: PreRegistrationLink[];
    count: number;
}

export const preRegistrationService = {
    /**
     * Generate a new pre-registration link (staff only)
     */
    generateLink: async (expiresInDays?: number): Promise<PreRegistrationLink> => {
        const response = await apiClient.post<PreRegistrationLink>("/api/v1/pre-registration/links", {
            expires_in_days: expiresInDays,
        });
        return response.data;
    },

    /**
     * Generate multiple pre-registration links at once (staff only)
     */
    generateBulkLinks: async (quantity: number, expiresInDays?: number): Promise<BulkLinksResponse> => {
        const response = await apiClient.post<BulkLinksResponse>("/api/v1/pre-registration/links/bulk", {
            quantity,
            expires_in_days: expiresInDays,
        });
        return response.data;
    },

    /**
     * Get registration form data by token (public)
     */
    getByToken: async (token: string): Promise<PreRegistrationTokenResponse> => {
        const response = await publicApiClient.get<PreRegistrationTokenResponse>(`/api/v1/pre-registration/${token}`);
        return response.data;
    },

    /**
     * Submit customer registration data (public)
     */
    submit: async (token: string, data: PreRegistrationFormData): Promise<{ message: string; submission_id: number }> => {
        const response = await publicApiClient.post<{ message: string; submission_id: number }>(
            `/api/v1/pre-registration/${token}/submit`,
            data
        );
        return response.data;
    },

    /**
     * Get all submissions (staff only)
     */
    getSubmissions: async (params?: { status?: string; search?: string; page?: number; per_page?: number }): Promise<PaginatedResponse<PreRegistrationSubmission>> => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);
        if (params?.search) queryParams.append('search', params.search);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
        
        const response = await apiClient.get<PaginatedResponse<PreRegistrationSubmission>>(
            `/api/v1/pre-registration/submissions?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Get submission details (staff only)
     */
    getSubmission: async (id: number): Promise<PreRegistrationSubmissionDetail> => {
        const response = await apiClient.get<PreRegistrationSubmissionDetail>(`/api/v1/pre-registration/submissions/${id}`);
        return response.data;
    },

    /**
     * Approve submission (staff only)
     */
    approve: async (id: number, reviewNotes?: string): Promise<{ message: string; customer_id: number; submission_id: number }> => {
        const response = await apiClient.post<{ message: string; customer_id: number; submission_id: number }>(
            `/api/v1/pre-registration/submissions/${id}/approve`,
            { review_notes: reviewNotes }
        );
        return response.data;
    },

    /**
     * Reject submission (staff only)
     */
    reject: async (id: number, reviewNotes: string): Promise<{ message: string; submission_id: number }> => {
        const response = await apiClient.post<{ message: string; submission_id: number }>(
            `/api/v1/pre-registration/submissions/${id}/reject`,
            { review_notes: reviewNotes }
        );
        return response.data;
    },

    /**
     * Get all pending (not yet submitted) links (staff only)
     */
    getPendingLinks: async (params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<PreRegistrationLink>> => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
        
        const response = await apiClient.get<PaginatedResponse<PreRegistrationLink>>(
            `/api/v1/pre-registration/links/pending?${queryParams.toString()}`
        );
        return response.data;
    },

    /**
     * Delete a pending link (staff only)
     */
    deleteLink: async (id: number): Promise<{ message: string }> => {
        const response = await apiClient.delete<{ message: string }>(`/api/v1/pre-registration/links/${id}`);
        return response.data;
    },
};

