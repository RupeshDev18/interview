import { apiClient } from '@/lib/api-client';
import type { AuthUser } from '@/stores/auth.store';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyId?: string;
  role?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export const authApiService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await apiClient.post<{ data: AuthResponse }>('/auth/login', payload);
    return res.data.data;
  },

  async register(payload: RegisterPayload): Promise<{ user: AuthUser }> {
    const res = await apiClient.post<{ data: { user: AuthUser } }>('/auth/register', payload);
    return res.data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async logoutAll(): Promise<void> {
    await apiClient.post('/auth/logout-all');
  },

  async me(): Promise<AuthUser> {
    const res = await apiClient.get<{ data: { user: AuthUser } }>('/auth/me');
    return res.data.data.user;
  },

  async refresh(): Promise<{ accessToken: string }> {
    const res = await apiClient.post<{ data: { accessToken: string } }>('/auth/refresh');
    return res.data.data;
  },

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    await apiClient.post('/auth/change-password', payload);
  },
};
