import apiClient from '../client';
import { LoginCredentials, RegisterCredentials, User } from '@/types/auth';
import axios from 'axios';

// Helper to get CSRF cookie with retries
async function getCsrfCookieWithRetry(maxRetries = 3): Promise<void> {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios.get(`${baseURL}/sanctum/csrf-cookie`, {
                withCredentials: true,
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            
            // Wait a bit longer to ensure cookie is set
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Verify cookie was set by checking if we can read it
            if (typeof document !== 'undefined') {
                const cookies = document.cookie;
                if (cookies.includes('XSRF-TOKEN=')) {
                    console.log(`CSRF cookie retrieved successfully on attempt ${attempt}`);
                    return;
                }
            }
            
            // If we can't verify, but got a successful response, assume it worked
            if (response.status === 204 || response.status === 200) {
                console.log(`CSRF cookie request successful on attempt ${attempt}`);
                return;
            }
        } catch (error: any) {
            console.warn(`CSRF cookie attempt ${attempt} failed:`, error.message);
            if (attempt === maxRetries) {
                throw new Error(`Failed to get CSRF token after ${maxRetries} attempts: ${error.message}`);
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 300 * attempt));
        }
    }
}

export const authService = {
    async getCsrfToken() {
        try {
            await getCsrfCookieWithRetry();
        } catch (error: any) {
            console.error('Failed to get CSRF token:', error);
            throw error;
        }
    },

    async login(credentials: LoginCredentials) {
        // Get CSRF token first with retries
        try {
            await this.getCsrfToken();
        } catch (csrfError: any) {
            console.error('Failed to get CSRF token before login:', csrfError);
            throw new Error('Failed to initialize CSRF protection. Please refresh the page and try again.');
        }
        
        // Verify CSRF token is available before making the request
        if (typeof document !== 'undefined') {
            const xsrfToken = document.cookie
                .split('; ')
                .find(row => row.startsWith('XSRF-TOKEN='))
                ?.split('=')[1];
            
            if (!xsrfToken) {
                console.warn('XSRF-TOKEN cookie not found, attempting to get CSRF token again...');
                await this.getCsrfToken();
            } else {
                console.log('XSRF-TOKEN cookie found, proceeding with login');
            }
        }
        
        try {
            const response = await apiClient.post('/api/v1/login', credentials);
            return response.data;
        } catch (error: any) {
            // Handle CSRF errors specifically
            if (error.response?.status === 419) {
                console.log('CSRF token mismatch (419), retrying with fresh token...');
                try {
                    // Get a fresh CSRF token
                    await this.getCsrfToken();
                    // Wait a bit longer for cookie to be set
                    await new Promise(resolve => setTimeout(resolve, 200));
                    // Retry the login
                    const retryResponse = await apiClient.post('/api/v1/login', credentials);
                    return retryResponse.data;
                } catch (retryError: any) {
                    console.error('Login retry failed:', retryError);
                    if (retryError.response?.status === 419) {
                        throw new Error('CSRF token validation failed. Please refresh the page and try again.');
                    }
                    throw retryError;
                }
            }
            throw error;
        }
    },

    async register(credentials: RegisterCredentials) {
        // Get CSRF token first
        await this.getCsrfToken();
        
        try {
            const response = await apiClient.post('/api/v1/register', credentials);
            return response.data;
        } catch (error: any) {
            // Handle CSRF errors specifically
            if (error.response?.status === 419) {
                // CSRF token expired, try again with fresh token
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
        const response = await apiClient.get('/api/v1/user');
        return response.data;
    },
};
