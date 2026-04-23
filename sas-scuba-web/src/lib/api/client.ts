import axios from 'axios';

// Helper to get the API URL dynamically to support both localhost and LAN access simultaneously
export function getApiUrl(): string {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        // In local development/LAN, we usually use http for the API
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || 
                        hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.');
        
        const finalProtocol = isLocal ? 'http:' : protocol;
        return `${finalProtocol}//${hostname}:8000`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

// Helper to ensure media URLs (images, documents) point to the correct API host
export function getMediaUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('/')) return `${getApiUrl()}${url}`;
    
    try {
        const urlObj = new URL(url);
        const dynamicApiUrl = new URL(getApiUrl());
        const isLocalHost = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
        const isLanIp = urlObj.hostname.startsWith('192.168.') || 
                        urlObj.hostname.startsWith('10.') || 
                        urlObj.hostname.startsWith('172.');
                            
        if (isLocalHost || isLanIp) {
            urlObj.protocol = dynamicApiUrl.protocol;
            urlObj.host = dynamicApiUrl.host;
            return urlObj.toString();
        }
    } catch (e) {}
    return url;
}

// Helper to ensure frontend URLs point to the correct host
export function getFrontendUrl(url: string | null | undefined): string {
    if (!url) return '';
    try {
        const urlObj = new URL(url);
        if (typeof window !== 'undefined') {
            const currentUrl = new URL(window.location.href);
            const isLocalHost = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
            const isLanIp = urlObj.hostname.startsWith('192.168.') || 
                            urlObj.hostname.startsWith('10.') || 
                            urlObj.hostname.startsWith('172.');
                            
            if (isLocalHost || isLanIp) {
                urlObj.protocol = currentUrl.protocol;
                urlObj.host = currentUrl.host;
                return urlObj.toString();
            }
        }
    } catch (e) {}
    return url;
}

const apiClient = axios.create({
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
    withXSRFToken: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
});

// Dynamic baseURL interceptor
apiClient.interceptors.request.use((config) => {
    config.baseURL = getApiUrl();
    return config;
});

// Response interceptor for better error messages
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
            error.userMessage = 'Unable to connect to server. Please ensure the backend is running.';
        }
        
        if (error.response?.status === 401 || error.response?.status === 419) {
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
