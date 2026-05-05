import axios from 'axios';

/**
 * Returns the base API URL.
 *
 * With the Next.js reverse proxy in next.config.ts, all /api/* and /sanctum/*
 * requests are forwarded to the Laravel backend server-side. So we always use
 * the current page's origin (same host, same port) — no cross-origin requests.
 *
 * Fallback to NEXT_PUBLIC_API_URL only when window is unavailable (SSR/tests).
 */
export function getApiUrl(): string {
    if (typeof window !== 'undefined') {
        // Same origin — Next.js proxy handles forwarding to :8000
        return `${window.location.protocol}//${window.location.host}`;
    }
    // Server-side: use env or localhost
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

// Helper to ensure media URLs (images, documents) point to the correct host
export function getMediaUrl(url: string | null | undefined): string {
    if (!url) return '';

    // If it's a /storage/ path, use the current origin (proxied by Next.js)
    if (url.startsWith('/storage/')) {
        if (typeof window !== 'undefined') {
            return `${window.location.protocol}//${window.location.host}${url}`;
        }
        return url;
    }

    if (url.startsWith('/')) {
        return `${getApiUrl()}${url}`;
    }

    try {
        const urlObj = new URL(url);
        // Rewrite any backend :8000 storage URLs to go through the proxy
        if (urlObj.port === '8000' && urlObj.pathname.startsWith('/storage/')) {
            if (typeof window !== 'undefined') {
                return `${window.location.protocol}//${window.location.hostname}:${window.location.port || '3000'}${urlObj.pathname}`;
            }
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
            const isLocalHost = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
            const isLanIp = urlObj.hostname.startsWith('192.168.') ||
                            urlObj.hostname.startsWith('10.') ||
                            urlObj.hostname.startsWith('172.');

            if (isLocalHost || isLanIp) {
                urlObj.protocol = window.location.protocol;
                urlObj.host = window.location.host;
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

// Dynamic baseURL interceptor — always same origin so proxy handles routing
apiClient.interceptors.request.use((config) => {
    config.baseURL = getApiUrl();
    return config;
});

// Response interceptor
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
