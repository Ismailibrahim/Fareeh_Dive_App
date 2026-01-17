import axios, { AxiosError } from 'axios';

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
});

// Helper function to get cookie value by name
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift() || null;
        if (cookieValue) {
            console.log(`Cookie ${name} found:`, cookieValue.substring(0, 20) + '...');
        }
        return cookieValue;
    }
    console.warn(`Cookie ${name} not found. Available cookies:`, document.cookie ? document.cookie.split(';').map(c => c.trim().split('=')[0]) : 'none');
    return null;
}

// Request interceptor to ensure CSRF token is set for state-changing requests
let csrfTokenPromise: Promise<void> | null = null;

apiClient.interceptors.request.use(
    async (config) => {
        // Only get CSRF token for POST, PUT, PATCH, DELETE requests (not GET)
        if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
            // Skip CSRF for the CSRF endpoint itself
            if (!config.url?.includes('/sanctum/csrf-cookie')) {
                // Ensure we have a CSRF token cookie
                if (!csrfTokenPromise) {
                    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                    csrfTokenPromise = axios.get(
                        `${baseURL}/sanctum/csrf-cookie`,
                        { 
                            withCredentials: true,
                            headers: {
                                'Accept': 'application/json',
                                'X-Requested-With': 'XMLHttpRequest',
                            },
                        }
                    ).then(() => {
                        csrfTokenPromise = null;
                    }                    ).catch((error) => {
                        csrfTokenPromise = null;
                        console.error('Failed to get CSRF token in interceptor', error);
                        // Don't throw - let the request proceed, auth service will handle retries
                    });
                }
                
                try {
                    await csrfTokenPromise;
                } catch (error) {
                    // If CSRF fetch failed, log but don't block the request
                    // The auth service will handle retries
                    console.warn('CSRF token fetch failed in interceptor, request may fail');
                }
                
                // Wait longer to ensure cookie is set (browser needs time to process the cookie)
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Read XSRF-TOKEN cookie and set it as X-XSRF-TOKEN header
                // Laravel stores it as XSRF-TOKEN cookie, but expects X-XSRF-TOKEN header
                const xsrfToken = getCookie('XSRF-TOKEN');
                if (xsrfToken) {
                    const decodedToken = decodeURIComponent(xsrfToken);
                    config.headers['X-XSRF-TOKEN'] = decodedToken;
                    console.log('CSRF token added to request header for', config.method?.toUpperCase(), config.url);
                } else {
                    console.warn('XSRF-TOKEN cookie not found after fetch, request may fail with 419');
                    // Try one more time with a fresh request
                    try {
                        await axios.get(
                            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/sanctum/csrf-cookie`,
                            { 
                                withCredentials: true,
                                headers: {
                                    'Accept': 'application/json',
                                    'X-Requested-With': 'XMLHttpRequest',
                                },
                            }
                        );
                        await new Promise(resolve => setTimeout(resolve, 150));
                        const retryToken = getCookie('XSRF-TOKEN');
                        if (retryToken) {
                            config.headers['X-XSRF-TOKEN'] = decodeURIComponent(retryToken);
                            console.log('CSRF token retrieved on retry and added to request header');
                        } else {
                            console.error('XSRF-TOKEN cookie still not found after retry');
                        }
                    } catch (e) {
                        console.error('Failed to retry CSRF token in interceptor:', e);
                    }
                }
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
        // Handle network errors with better messaging
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
            const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            console.error(`Network Error: Unable to connect to API at ${baseURL}. Please ensure the backend server is running.`);
            
            // Don't redirect on network errors during login/register
            if (typeof window !== 'undefined' && window.location.pathname.includes('/login')) {
                // Return a more descriptive error for login page
                error.userMessage = `Cannot connect to server at ${baseURL}. Please ensure the backend API is running.`;
            }
        }
        
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
