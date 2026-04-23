import apiClient, { getApiUrl } from '../client';
import { LoginCredentials, RegisterCredentials, User } from '@/types/auth';
import axios from 'axios';

export const authService = {
    async getCsrfToken() {
        const baseURL = getApiUrl();
        try {
            // Standard Sanctum CSRF cookie initialization
            await axios.get(`${baseURL}/sanctum/csrf-cookie`, {
                withCredentials: true,
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
        } catch (error: any) {
            console.error('CSRF Initialization Error:', error);
            throw new Error('Could not connect to the security service. Please ensure the backend is running and refresh.');
        }
    },

    async login(credentials: LoginCredentials) {
        // Initialize CSRF first
        await this.getCsrfToken();
        
        try {
            const response = await apiClient.post('/api/v1/login', credentials);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 419) {
                // Retry once if CSRF token expired
                await this.getCsrfToken();
                const retryResponse = await apiClient.post('/api/v1/login', credentials);
                return retryResponse.data;
            }
            throw error;
        }
    },

    async register(credentials: RegisterCredentials) {
        await this.getCsrfToken();
        try {
            const response = await apiClient.post('/api/v1/register', credentials);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 419) {
                await this.getCsrfToken();
                const retryResponse = await apiClient.post('/api/v1/register', credentials);
                return retryResponse.data;
            }
            throw error;
        }
    },

    async logout() {
        return apiClient.post('/api/v1/logout');
    },

    async getUser() {
        // Initial user check
        try {
            const response = await apiClient.get('/api/v1/user');
            return response.data;
        } catch (error: any) {
            // If network error, maybe wait and try once more
            if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const retryResponse = await apiClient.get('/api/v1/user');
                return retryResponse.data;
            }
            throw error;
        }
    },

    async forgotPassword(email: string) {
        const response = await apiClient.post('/api/v1/password/forgot', { email });
        return response.data;
    },

    async resetPassword(data: {
        email: string;
        token: string;
        password: string;
        password_confirmation: string;
    }) {
        const response = await apiClient.post('/api/v1/password/reset', data);
        return response.data;
    },

    async changePassword(data: {
        current_password: string;
        password: string;
        password_confirmation: string;
    }) {
        const response = await apiClient.post('/api/v1/password/change', data);
        return response.data;
    },

    async verifyEmail(email: string, token: string) {
        const response = await apiClient.post('/api/v1/email/verify', { email, token });
        return response.data;
    },

    async resendVerificationEmail() {
        const response = await apiClient.post('/api/v1/email/resend');
        return response.data;
    },
};
