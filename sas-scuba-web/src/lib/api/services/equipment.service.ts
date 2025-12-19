import apiClient from "../client";

export interface Equipment {
    id: number;
    dive_center_id: number;
    name: string;
    category?: string;
    active: boolean;
    sizes?: string[];
    brands?: string[];
    created_at: string;
    updated_at: string;
    equipment_items?: EquipmentItem[];
}

export interface EquipmentItem {
    id: number;
    equipment_id: number;
    size?: string;
    serial_no?: string;
    status: 'Available' | 'Rented' | 'Maintenance';
    created_at: string;
    updated_at: string;
}

export interface EquipmentFormData {
    name: string;
    category?: string;
    sizes?: string[];
    brands?: string[];
}

export interface PaginationParams {
    page?: number;
    per_page?: number;
    category?: string;
    search?: string;
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

export const equipmentService = {
    getAll: async (params?: PaginationParams) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
        if (params?.category) queryParams.append('category', params.category);
        if (params?.search) queryParams.append('search', params.search);
        
        const response = await apiClient.get<PaginatedResponse<Equipment>>(`/api/v1/equipment?${queryParams.toString()}`);
        return response.data;
    },

    create: async (data: EquipmentFormData) => {
        const response = await apiClient.post<Equipment>("/api/v1/equipment", data);
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await apiClient.get<Equipment>(`/api/v1/equipment/${id}`);
        return response.data;
    },

    update: async (id: number, data: EquipmentFormData) => {
        const response = await apiClient.put<Equipment>(`/api/v1/equipment/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/api/v1/equipment/${id}`);
    },

    bulkCreate: async (equipment: EquipmentFormData[]) => {
        const response = await apiClient.post<{
            message: string;
            success_count: number;
            error_count: number;
            results: {
                success: Array<{ row: number; id: number; name: string }>;
                errors: Array<{ row: number; name: string; error: string }>;
            };
        }>("/api/v1/equipment/bulk", { equipment });
        return response.data;
    },

    importPreview: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await apiClient.post<{
            valid: Array<{
                row: number;
                name: string;
                category?: string;
                sizes: string[];
                brands: string[];
                active: boolean;
            }>;
            duplicates: Array<{ row: number; name: string }>;
            errors: Array<{ row: number; name: string; error: string }>;
            summary: {
                total_rows: number;
                valid_count: number;
                duplicate_count: number;
                error_count: number;
            };
        }>("/api/v1/equipment/import-preview", formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    import: async (equipment: Array<{
        row: number;
        name: string;
        category?: string;
        sizes: string[];
        brands: string[];
        active?: boolean;
    }>) => {
        const response = await apiClient.post<{
            message: string;
            success_count: number;
            error_count: number;
            results: {
                success: Array<{ row: number; id: number; name: string }>;
                errors: Array<{ row: number; name: string; error: string }>;
            };
        }>("/api/v1/equipment/import", { equipment });
        return response.data;
    },

    downloadTemplate: async () => {
        try {
            const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const url = `${baseURL}/api/v1/equipment/import-template`;
            
            // Use fetch directly to avoid axios interceptor issues with blob responses
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include', // Include cookies for authentication
                headers: {
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            
            // Check if response is successful
            if (!response.ok) {
                // Try to parse error message
                try {
                    const errorText = await response.text();
                    const json = JSON.parse(errorText);
                    throw new Error(json.message || json.error || 'Failed to download template');
                } catch (parseError) {
                    throw new Error(`Failed to download template (Status: ${response.status})`);
                }
            }
            
            // Check Content-Type
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                // It's an error response
                const errorText = await response.text();
                const json = JSON.parse(errorText);
                throw new Error(json.message || json.error || 'Failed to download template');
            }
            
            // Success - get blob and download
            const blob = await response.blob();
            
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `equipment_import_template_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error: any) {
            console.error('Download template error:', error);
            
            // If it's already an Error with a message, re-throw it
            if (error instanceof Error) {
                throw error;
            }
            
            // Handle other error types
            const errorMessage = error.message || 'Failed to download template. Please try again.';
            throw new Error(errorMessage);
        }
    }
};

