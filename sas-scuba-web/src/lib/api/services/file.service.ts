import apiClient from "../client";

export interface FileUploadResponse {
    success: boolean;
    fileId: number;
    url: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    category: string;
    createdAt: string;
    message?: string;
}

export interface FileInfo {
    id: number;
    url: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    category: string;
    uploadedBy?: string;
    createdAt: string;
}

export interface FileListResponse {
    success: boolean;
    files: FileInfo[];
}

export interface StorageUsageResponse {
    success: boolean;
    usage: {
        storageBytes: number;
        storageFormatted: string;
        fileCount: number;
        lastUpdated: string;
    };
}

export const fileService = {
    /**
     * Upload a file with entity context
     */
    upload: async (
        file: File,
        entityType: string,
        entityId: string,
        category: string
    ): Promise<FileUploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', entityType);
        formData.append('entityId', entityId);
        formData.append('category', category);

        const response = await apiClient.post<FileUploadResponse>(
            '/api/v1/files/upload',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    },

    /**
     * List files for an entity
     */
    list: async (
        entityType: string,
        entityId: string,
        category?: string
    ): Promise<FileInfo[]> => {
        let url = `/api/v1/files/${entityType}/${entityId}`;
        if (category) {
            url += `?category=${encodeURIComponent(category)}`;
        }

        const response = await apiClient.get<FileListResponse>(url);
        return response.data.files;
    },

    /**
     * Get file details
     */
    get: async (fileId: number): Promise<FileInfo> => {
        const response = await apiClient.get<{ success: boolean; file: FileInfo }>(
            `/api/v1/files/${fileId}`
        );
        return response.data.file;
    },

    /**
     * Delete a file
     */
    delete: async (fileId: number): Promise<void> => {
        await apiClient.delete(`/api/v1/files/${fileId}`);
    },

    /**
     * Get storage usage for current tenant
     */
    getUsage: async (): Promise<StorageUsageResponse['usage']> => {
        const response = await apiClient.get<StorageUsageResponse>(
            '/api/v1/storage/usage'
        );
        return response.data.usage;
    },

    /**
     * Download a file
     */
    download: async (fileId: number, filename: string): Promise<void> => {
        const response = await apiClient.get(
            `/api/v1/storage/files/${fileId}/download`,
            {
                responseType: 'blob',
            }
        );

        // Create blob link and download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
};

