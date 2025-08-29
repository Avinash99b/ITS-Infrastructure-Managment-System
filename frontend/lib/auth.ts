
'use client';
import { API_BASE_URL } from './api';

export const login = async (credentials: {mobile_no: string, password: string}) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
    }

    const data = await response.json();
    if (typeof window !== 'undefined') {
        document.cookie = `token=${data.token}; path=/; max-age=86400`;
        localStorage.setItem('user', JSON.stringify({
            id: data.user.id, 
            name: data.user.name, 
            image_url: data.user.image_url || '',
            permissions: data.user.permissions || []
        }));
        localStorage.setItem('token',data.token)
    }
    return data;
};

export const register = async (credentials: {name: string, email: string, mobile_no: string, password: string}) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
    }

    return response.json();
}

export const forgotPassword = async (mobile_no: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_no }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reset link');
    }

    return response.json();
};

export const logout = () => {
    if (typeof window !== 'undefined') {
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }
};

export const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.startsWith('token=')) {
                return cookie.substring('token='.length, cookie.length);
            }
        }
    }
    return null;
};

export const isAuthenticated = (): boolean => {
    return getAuthToken() !== null;
};

export const hasPermission = (permission: string): boolean => {
    if(typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            return user.permissions?.includes(permission);
        }
    }
    return false;
}
