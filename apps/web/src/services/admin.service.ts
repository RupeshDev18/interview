import { apiClient } from '@/lib/api-client';
import type { ApiSuccessResponse } from '@intvwplt/shared';

export interface CompanyItem {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    users: number;
    candidates: number;
    interviews: number;
  };
}

export interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: 'ADMIN' | 'COMPANY_ADMIN' | 'RECRUITER' | 'INTERVIEWER';
  isActive: boolean;
  companyId?: string | null;
  company?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface AnalyticsOverview {
  totalCompanies: number;
  totalUsers: number;
  totalCandidates: number;
  totalInterviews: number;
  totalInterviewers: number;
  averageScore: number | null;
  candidateStatusDistribution: Array<{ status: string; count: number }>;
  interviewStatusDistribution: Array<{ status: string; count: number }>;
  recommendationDistribution: Record<string, number>;
  timeline: Array<{ date: string; total: number; completed: number }>;
}

export const adminService = {
  // Companies
  async listCompanies(params?: { page?: number; limit?: number; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);

    const response = await apiClient.get<any>(`/companies?${query.toString()}`);
    const data = response.data;
    return (data.data?.items || data.data || data.items || []) as CompanyItem[];
  },

  async createCompany(data: { name: string; email?: string; phone?: string; website?: string }) {
    const response = await apiClient.post<ApiSuccessResponse<CompanyItem>>('/companies', data);
    return response.data.data;
  },

  async updateCompany(id: string, data: Partial<CompanyItem>) {
    const response = await apiClient.patch<ApiSuccessResponse<CompanyItem>>(`/companies/${id}`, data);
    return response.data.data;
  },

  async deleteCompany(id: string) {
    const response = await apiClient.delete<ApiSuccessResponse<void>>(`/companies/${id}`);
    return response.data;
  },

  // Users
  async listUsers(params?: { page?: number; limit?: number; search?: string; role?: string; companyId?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.role) query.append('role', params.role);
    if (params?.companyId) query.append('companyId', params.companyId);

    const response = await apiClient.get<any>(`/users?${query.toString()}`);
    const data = response.data;
    return (data.data?.items || data.data || data.items || []) as UserItem[];
  },

  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    companyId?: string;
    phone?: string;
  }) {
    const response = await apiClient.post<ApiSuccessResponse<UserItem>>('/users', data);
    return response.data.data;
  },

  async updateUser(id: string, data: Partial<UserItem> & { password?: string }) {
    const response = await apiClient.patch<ApiSuccessResponse<UserItem>>(`/users/${id}`, data);
    return response.data.data;
  },

  async deleteUser(id: string) {
    const response = await apiClient.delete<ApiSuccessResponse<void>>(`/users/${id}`);
    return response.data;
  },

  // Analytics
  async getAnalyticsOverview() {
    const response = await apiClient.get<ApiSuccessResponse<AnalyticsOverview>>('/analytics/overview');
    return response.data.data;
  },
};
