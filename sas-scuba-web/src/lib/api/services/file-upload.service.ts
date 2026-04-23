import apiClient from "../client";

export interface FileUploadResponse {
    success: boolean;
    url: string;
    path: string;
    original_name: string;
    message?: string;
}

export interface UploadOptions {
    folder?: string;
    entityType?: string;
    entityId?: string;
    category?: string;
}

export const fileUploadService = {
    upload: async (file: File, options?: string | UploadOptions): Promise<FileUploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        
        if (typeof options === 'string') {
            formData.append('folder', options);
        } else if (options) {
            if (options.folder) formData.append('folder', options.folder);
            if (options.entityType) formData.append('entityType', options.entityType);
            if (options.entityId) formData.append('entityId', options.entityId);
            if (options.category) formData.append('category', options.category);
        }

        const response = await apiClient.post<FileUploadResponse>('/api/v1/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },
};

