const API_BASE_URL = import.meta.env.VITE_API_URI || '';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';

console.log(import.meta.env)

if (!API_BASE_URL) {
  throw new Error("Environment variable VITE_API_URI is required but not set.");
}

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
    body?: any;
}

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
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
};

const healthCheck = async () => {
    const r = await fetch(`${API_BASE_URL}/`);
    return r.ok;
};

export { apiFetch, healthCheck };
