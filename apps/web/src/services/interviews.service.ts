import { apiClient } from '@/lib/api-client';
import axios from 'axios';
import type {
  InterviewDto,
  CreateInterviewDto,
  UpdateInterviewDto,
  UpdateInterviewNotesDto,
  UpdateQuestionNotesDto,
  InterviewStatus,
  InterviewFiltersDto,
  ApiSuccessResponse,
  CandidateJoinDetailsDto,
  CreateGuestLinkDto,
  GuestJoinDetailsDto,
} from '@intvwplt/shared';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const interviewsService = {
  async list(filters?: InterviewFiltersDto & { page?: number; limit?: number }) {
    const params = new URLSearchParams();
    if (filters?.candidateId) params.append('candidateId', filters.candidateId);
    if (filters?.interviewerId) params.append('interviewerId', filters.interviewerId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await apiClient.get<any>(
      `/interviews?${params.toString()}`,
    );
    const body = response.data;
    if (body?.data?.items) {
      return {
        items: body.data.items as InterviewDto[],
        pagination: body.data.pagination,
      };
    }
    if (Array.isArray(body?.data)) {
      return {
        items: body.data as InterviewDto[],
        pagination: { page: 1, limit: body.data.length, total: body.data.length, totalPages: 1 },
      };
    }
    return { items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  },

  async getById(id: string) {
    const response = await apiClient.get<ApiSuccessResponse<InterviewDto>>(
      `/interviews/${id}`,
    );
    return response.data.data;
  },

  async getByMeetingRoomId(meetingRoomId: string) {
    const response = await apiClient.get<ApiSuccessResponse<InterviewDto>>(
      `/interviews/room/${meetingRoomId}`,
    );
    return response.data.data;
  },

  async create(data: CreateInterviewDto) {
    const response = await apiClient.post<ApiSuccessResponse<InterviewDto>>(
      '/interviews',
      data,
    );
    return response.data.data;
  },

  async update(id: string, data: UpdateInterviewDto) {
    const response = await apiClient.patch<ApiSuccessResponse<InterviewDto>>(
      `/interviews/${id}`,
      data,
    );
    return response.data.data;
  },

  async updateStatus(id: string, status: InterviewStatus, cancelReason?: string) {
    const response = await apiClient.patch<ApiSuccessResponse<InterviewDto>>(
      `/interviews/${id}/status`,
      { status, cancelReason },
    );
    return response.data.data;
  },

  async updateNotes(id: string, data: UpdateInterviewNotesDto) {
    const response = await apiClient.patch<ApiSuccessResponse<{ notes: string }>>(
      `/interviews/${id}/notes`,
      data,
    );
    return response.data.data;
  },

  async updateQuestionNotes(
    interviewId: string,
    questionId: string,
    data: UpdateQuestionNotesDto,
  ) {
    const response = await apiClient.patch<ApiSuccessResponse<any>>(
      `/interviews/${interviewId}/questions/${questionId}`,
      data,
    );
    return response.data.data;
  },

  async createCandidateLink(id: string) {
    const response = await apiClient.post<ApiSuccessResponse<{ token: string; expiresAt: string }>>(
      `/interviews/${id}/candidate-link`,
    );
    return response.data.data;
  },

  async generateCandidateLink(id: string) {
    const data = await this.createCandidateLink(id);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return { ...data, link: `${origin}/interview/join/${data.token}` };
  },

  async getCandidateJoinDetails(token: string) {
    const response = await axios.get<ApiSuccessResponse<CandidateJoinDetailsDto>>(
      `${BASE_URL}/api/v1/interviews/candidate/join/${token}`,
    );
    return response.data.data;
  },

  async createGuestLink(id: string, data?: CreateGuestLinkDto) {
    const response = await apiClient.post<
      ApiSuccessResponse<{
        token: string;
        guestJoinUrl: string;
        role: string;
        guestName: string;
      }>
    >(`/interviews/${id}/guest-link`, data || {});
    return response.data.data;
  },

  async generateGuestLink(id: string, data?: CreateGuestLinkDto) {
    const res = await this.createGuestLink(id, data);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return { ...res, link: `${origin}/interview/guest/${res.token}` };
  },

  async getGuestJoinDetails(token: string) {
    const response = await axios.get<ApiSuccessResponse<GuestJoinDetailsDto>>(
      `${BASE_URL}/api/v1/interviews/guest/join/${token}`,
    );
    return response.data.data;
  },
};
