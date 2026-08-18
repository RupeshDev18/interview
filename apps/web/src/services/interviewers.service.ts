import { apiClient } from '@/lib/api-client';
import type {
  InterviewerSummary,
  ApiSuccessResponse,
} from '@intvwplt/shared';

export const interviewersService = {
  async list(filters?: { isAvailable?: boolean; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.isAvailable !== undefined) {
      params.append('isAvailable', String(filters.isAvailable));
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    const response = await apiClient.get<any>(
      `/interviewers?${params.toString()}`,
    );
    const body = response.data;
    if (Array.isArray(body?.data)) return body.data as InterviewerSummary[];
    if (Array.isArray(body)) return body as InterviewerSummary[];
    return [];
  },

  async getById(id: string) {
    const response = await apiClient.get<ApiSuccessResponse<InterviewerSummary>>(
      `/interviewers/${id}`,
    );
    return response.data.data;
  },
};
