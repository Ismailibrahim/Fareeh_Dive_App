import apiClient from "../client";

export interface FileUploadResponse {
    success: boolean;
    url: string;
    path: string;
    original_name: string;
    message?: string;
}

export const fileUploadService = {
    upload: async (file: File, folder?: string): Promise<FileUploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        if (folder) {
            formData.append('folder', folder);
        }

        const response = await apiClient.post<FileUploadResponse>('/api/v1/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },
};

