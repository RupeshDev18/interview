import { apiClient } from '@/lib/api-client';
import type {
  CandidateSummary,
  CandidateDossierDto,
  PaginatedResponse,
  ApiSuccessResponse,
  CandidateStatus,
} from '@intvwplt/shared';

export const candidatesService = {
  async list(filters?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: CandidateStatus;
    skills?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.skills) params.append('skills', filters.skills);

    const response = await apiClient.get<any>(
      `/candidates?${params.toString()}`,
    );
    const body = response.data;
    if (body?.data?.items) {
      return body.data as PaginatedResponse<CandidateSummary>;
    }
    if (body?.items) {
      return body as PaginatedResponse<CandidateSummary>;
    }
    return {
      items: Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [],
      pagination: body?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },

  async getById(id: string) {
    const response = await apiClient.get<ApiSuccessResponse<CandidateSummary>>(
      `/candidates/${id}`,
    );
    return response.data.data;
  },

  async getDossier(id: string) {
    const response = await apiClient.get<ApiSuccessResponse<CandidateDossierDto>>(
      `/candidates/${id}/dossier`,
    );
    return response.data.data;
  },

  async create(data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    location?: string;
    currentRole?: string;
    experienceYears?: number;
    skills?: string[];
    linkedinUrl?: string;
  }) {
    const response = await apiClient.post<any>('/candidates', data);
    return response.data?.data || response.data;
  },

  async updateStatus(id: string, status: CandidateStatus) {
    const response = await apiClient.patch<ApiSuccessResponse<CandidateSummary>>(
      `/candidates/${id}/status`,
      { status },
    );
    return response.data.data;
  },
};
