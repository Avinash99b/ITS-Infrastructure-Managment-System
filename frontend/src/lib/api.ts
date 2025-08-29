

'use client';
import type {
  PaginatedUsersResponse,
  PaginatedRoomsResponse,
  Block,
  User,
  PaginatedFaultsResponse,
  UserProfile,
  Fault,
  FaultType,
  Room,
  PaginatedSystemsResponse,
  System,
  Permission,
} from '@/types';
import { getAuthToken } from './auth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React from 'react';

export const API_BASE_URL = "https://its.api.avinash9.tech";
function getFullImageUrl(path: string | null): string{
    if (!path) return "";
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
}

async function fetcher<T>(
  url: string,
  options: RequestInit = {},
  isText: boolean = false
): Promise<T> {
  const token = getAuthToken();
  const headers = options.headers || {};
  
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !isText) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }


  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 204) {
      return null as T;
    }
    const errorData = await response.json().catch(() => ({}));

    let errorMessage = errorData.error || `API Error: ${response.status} ${response.statusText}`;

    if (errorMessage.toLowerCase() === "no token provided") {
        throw new Error("AUTH_ERROR"); // Use a specific error message
    }
    
    if (response.status === 404 && errorData.error) {
      errorMessage = errorData.error;
    } else if (errorData.details) {
        errorMessage = `${errorData.error}: ${errorData.details.map((d: { field: string, message: string }) => `${d.field}: ${d.message}`).join(', ')}`;
    }else if(response.status===403){
      errorMessage="403: You do not have permission to perform this action";
    }
    
    throw new Error(errorMessage);
  }
  if (response.status === 204) {
    return null as T;
  }
  
  if (isText) {
    return response.text() as Promise<T>;
  }
  
  return response.json();
}

const handleApiError = (error: unknown, toastFn: (options: any) => void, title: string) => {
    if (error instanceof Error && error.message === 'AUTH_ERROR') {
      toastFn({
        variant: "destructive",
        title: "Authentication Required",
        description: React.createElement("div", { className: "flex items-center justify-between" }, 
          "You need to login for this action.",
           React.createElement(Link, { href: "/login", className: "ml-4 text-sm underline" }, "Login")
        ),
      });
      return; // Stop further execution
    }
    toastFn({
      variant: 'destructive',
      title,
      description:
        error instanceof Error ? error.message : 'An error occurred',
    });
};


// User API
export const getUsers = async (
  params: URLSearchParams
): Promise<PaginatedUsersResponse> => {
  const data = await fetcher<PaginatedUsersResponse>(`/api/v1/users?${params.toString()}`);
  data.users = data.users.map(user => ({
      ...user,
      image_url: getFullImageUrl(user.image_url),
  }));
  return data;
};

export const getUserById = async (id: string): Promise<User> => {
  const user = await fetcher<User>(`/api/v1/users/${id}`);
  user.image_url = getFullImageUrl(user.image_url) as string;
  return user;
};

export const getUserProfile = async (id: number): Promise<UserProfile> => {
  const profile = await fetcher<UserProfile>(`/api/v1/users/${id}/profile`);
  profile.image_url = getFullImageUrl(profile.image_url);
  return profile;
};

export const getCurrentUser = async (): Promise<User> => {
  const user = await fetcher<User>('/api/v1/users/me');
  user.image_url = getFullImageUrl(user.image_url);
  return user;
};

export const updateCurrentUser = async (data: { name?: string, email?: string }): Promise<User> => {
    const response = await fetcher<User>('/api/v1/users/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    response.image_url = getFullImageUrl(response.image_url);
    return response;
};

export const updateUserProfileImage = async (formData: FormData): Promise<User> => {
    const response = await fetcher<User>('/api/v1/users/me/profile-image', {
        method: 'PATCH',
        body: formData,
    });
    response.image_url = getFullImageUrl(response.image_url);
    return response;
};

export const updateUserStatus = (userId: number, status: string): Promise<void> => {
    return fetcher(`/api/v1/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
};

export const updateCurrentUserPassword = (data: { oldPassword?: string, newPassword?: string }): Promise<void> => {
    return fetcher('/api/v1/users/update-password', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}


// Permissions API
export const getPermissions = (): Promise<Permission[]> => {
  return fetcher('/api/v1/permissions');
};

export const updateUserPermissions = (userId: number, permissions: string[]): Promise<void> => {
    return fetcher(`/api/v1/users/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({ userId, permissions }),
    });
};


// Block API
export const getBlocks = (): Promise<Block[]> => {
  return fetcher('/api/v1/blocks');
};

export const createBlock = (data: Omit<Block, 'id' | 'created_at' | 'updated_at' | 'image_url'>): Promise<Block> => {
    return fetcher('/api/v1/blocks', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateBlock = (id: string, data: Partial<Omit<Block, 'id' | 'created_at' | 'updated_at' | 'image_url'>>): Promise<Block> => {
    return fetcher(`/api/v1/blocks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

export const deleteBlock = (id: string): Promise<void> => {
    return fetcher(`/api/v1/blocks/${id}`, {
        method: 'DELETE',
    });
};


// Room API
export const getRooms = async (
  params: URLSearchParams
): Promise<PaginatedRoomsResponse> => {
  return await fetcher<PaginatedRoomsResponse>(`/api/v1/rooms?${params.toString()}`);
};

export const createRoom = (data: { name: string; blockId: number; floor: number }): Promise<Room> => {
  return fetcher('/api/v1/rooms', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateRoom = (
  id: number,
  data: Partial<{ name: string; blockId: number; floor: number }>
): Promise<Room> => {
  return fetcher(`/api/v1/rooms/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const deleteRoom = (id: number): Promise<void> => {
  return fetcher(`/api/v1/rooms/${id}`, {
    method: 'DELETE',
  });
};

// Faults API
export const getFaultTypes = (): Promise<FaultType[]> => {
    return fetcher('/api/v1/faults');
};

export const getFaults = async (
  params: URLSearchParams
): Promise<PaginatedFaultsResponse> => {
  const response = await fetcher<PaginatedFaultsResponse>(`/api/v1/faults/reports?${params.toString()}`);
    response.data = response.data.map(fault => ({
        ...fault,
        reporter_image_url: getFullImageUrl(fault.reporter_image_url),
        technician_image_url: getFullImageUrl(fault.technician_image_url || null),
    }));
  return response;
};

export const createFault = (data: {
  system_disk_serial_no: string;
  fault_name: string;
  description?: string;
}): Promise<Fault> => {
  return fetcher('/api/v1/faults/report', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateFaultStatus = (fault_id: number, status: string): Promise<void> => {
    return fetcher('/api/v1/faults/report/status', {
        method: 'PATCH',
        body: JSON.stringify({ fault_id, status }),
    });
};

export const assignTechnician = (reportId: string, technicianId: number): Promise<any> => {
    return fetcher(`/api/v1/faults/reports/${reportId}/technicianId`, {
        method: 'POST',
        body: JSON.stringify({ technicianId }),
    });
};

// Systems API
export const getSystems = (params: URLSearchParams): Promise<PaginatedSystemsResponse> => {
  return fetcher(`/api/v1/systems?${params.toString()}`);
};

export const createSystem = (data: { name: string; disk_serial_no: string; type: string; status: string; }): Promise<System> => {
    return fetcher('/api/v1/systems', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateSystem = (disk_serial_no: string, data: { name: string }): Promise<System> => {
    return fetcher(`/api/v1/systems/${disk_serial_no}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const updateSystemSpeed = (disk_serial_no: string, speed: number): Promise<void> => {
    return fetcher(`/api/v1/systems/${disk_serial_no}/speed`, {
        method: 'PATCH',
        body: JSON.stringify({ speed }),
    });
};

// Metrics API
export const getMetrics = async () => {
    const textData = await fetcher<{totalRequests:number,averageDuration:number}>('/api/v1/metrics', {}, false);
    return {...textData};
    
};


export { handleApiError };

    
