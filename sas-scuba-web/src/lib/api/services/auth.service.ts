import apiClient from '../client';
import { LoginCredentials, RegisterCredentials, User } from '@/types/auth';

export const authService = {
    async getCsrfToken() {
        return apiClient.get('/sanctum/csrf-cookie');
    },

    async login(credentials: LoginCredentials) {
        await this.getCsrfToken();
        const response = await apiClient.post('/api/v1/login', credentials);
        return response.data;
    },

    async register(credentials: RegisterCredentials) {
        await this.getCsrfToken();
        const response = await apiClient.post('/api/v1/register', credentials);
        return response.data;
    },

    async logout() {
        return apiClient.post('/api/v1/logout');
    },

    async getUser() {
        const response = await apiClient.get('/api/v1/user');
        return response.data;
    },
};
