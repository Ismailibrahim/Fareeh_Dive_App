import axios, { AxiosError } from 'axios';

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
    withXSRFToken: true,
});

// Request interceptor to ensure CSRF token is set for state-changing requests
let csrfTokenPromise: Promise<void> | null = null;

apiClient.interceptors.request.use(
    async (config) => {
        // Only get CSRF token for POST, PUT, PATCH, DELETE requests (not GET)
        if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
            // Skip CSRF for the CSRF endpoint itself
            if (!config.url?.includes('/sanctum/csrf-cookie')) {
                if (!csrfTokenPromise) {
                    csrfTokenPromise = axios.get(
                        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/sanctum/csrf-cookie`,
                        { withCredentials: true }
                    ).then(() => {
                        csrfTokenPromise = null;
                    }).catch((error) => {
                        csrfTokenPromise = null;
                        console.error('Failed to get CSRF token', error);
                    });
                }
                await csrfTokenPromise;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 419) {
            // Handle session expiry or unauthorized access
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                // Redirect to login on auth errors
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
