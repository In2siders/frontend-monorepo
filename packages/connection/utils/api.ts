const API_BASE_URL = import.meta.env.VITE_API_URI || '';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';

if (!API_BASE_URL) {
    // Surface misconfiguration early during development

    console.error("Environment variable VITE_API_URI is required but not set. Configure it in your .env");
}

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
    body?: any;
}

// Runtime auth token managed by `setAuthToken` from the app's auth layer.
let AUTH_TOKEN: string | null = null;
export const setAuthToken = (token: string | null) => { AUTH_TOKEN = token }

/**
 * API fetch utility function
 * @param endpoint Endpoint (without version)
 * @param options Fetch options
 * @returns JSON with response
 */
const apiFetch = async (endpoint: string, options: FetchOptions = {}) => {
    if (endpoint.startsWith('/')) {
        endpoint = endpoint.slice(1);
    }
    if (endpoint.endsWith('/')) {
        endpoint = endpoint.slice(0, -1);
    }

    const url = `${API_BASE_URL}/${API_VERSION}/${endpoint}`;
    const response = await fetch(url, {
        ...options,
        // Include credentials by default so server-set HttpOnly cookies are sent.
        credentials: options.credentials ?? 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(AUTH_TOKEN && !(options.headers && 'Authorization' in options.headers) ? { Authorization: AUTH_TOKEN } : {}),
            ...options.headers
        }
    });
    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
};

const healthCheck = async () => {
    if (!API_BASE_URL) throw new Error("");
    const r = await fetch(`${API_BASE_URL}/`);
    return r.ok;
};

export { apiFetch, healthCheck };
