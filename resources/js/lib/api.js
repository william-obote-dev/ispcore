import { navigate } from '../router.js';

const TOKEN_KEY = 'ispcore_token';
const USER_KEY = 'ispcore_user';

export const auth = {
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },
    getUser() {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    },
    setSession(token, user) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    clear() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },
    isAuthenticated() {
        return Boolean(this.getToken());
    },
};

export class ApiError extends Error {
    constructor(message, status, errors) {
        super(message);
        this.status = status;
        this.errors = errors || null;
    }
}

/**
 * Thin wrapper around fetch() for the ISPCore JSON API.
 * Automatically attaches the bearer token and normalizes error handling.
 */
export async function api(path, { method = 'GET', body } = {}) {
    const headers = { Accept: 'application/json' };
    const token = auth.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body) headers['Content-Type'] = 'application/json';

    let res;
    try {
        res = await fetch(`/api${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
    }

    if (res.status === 401 && path !== '/auth/login') {
        auth.clear();
        if (location.pathname !== '/login') {
            navigate('/login', { replace: true });
        }
        throw new ApiError('Session expired. Please log in again.', 401);
    }

    const text = await res.text();
    let data = null;
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = null;
        }
    }

    if (!res.ok) {
        const message = data?.message || 'Something went wrong. Please try again.';
        throw new ApiError(message, res.status, data?.errors);
    }

    return data;
}
