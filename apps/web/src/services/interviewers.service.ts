import { apiClient } from '@/lib/api-client';
import type {
  InterviewerSummary,
  ApiSuccessResponse,
  AvailabilityRuleDto,
  AvailabilityExceptionDto,
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

  async getMine() {
    const response = await apiClient.get<ApiSuccessResponse<InterviewerSummary>>('/interviewers/me');
    return response.data.data;
  },

  async getAvailabilityRules(id: string) {
    const response = await apiClient.get<ApiSuccessResponse<AvailabilityRuleDto[]>>(`/interviewers/${id}/availability/rules`);
    return response.data.data;
  },

  async replaceAvailabilityRules(id: string, rules: Array<Omit<AvailabilityRuleDto, 'id'>>) {
    const response = await apiClient.put<ApiSuccessResponse<AvailabilityRuleDto[]>>(`/interviewers/${id}/availability/rules`, { rules });
    return response.data.data;
  },

  async getAvailabilityExceptions(id: string, from: string, to: string) {
    const response = await apiClient.get<ApiSuccessResponse<AvailabilityExceptionDto[]>>(`/interviewers/${id}/availability/exceptions`, { params: { from, to } });
    return response.data.data;
  },

  async addAvailabilityException(id: string, input: Omit<AvailabilityExceptionDto, 'id'>) {
    const response = await apiClient.post<ApiSuccessResponse<AvailabilityExceptionDto>>(`/interviewers/${id}/availability/exceptions`, input);
    return response.data.data;
  },

  async deleteAvailabilityException(id: string, exceptionId: string) {
    await apiClient.delete(`/interviewers/${id}/availability/exceptions/${exceptionId}`);
  },
};
