import { apiClient } from '@/lib/api-client';
import type {
  InterviewFeedbackDto,
  SubmitFeedbackDto,
  ApiSuccessResponse,
} from '@intvwplt/shared';

export const feedbackService = {
  async getByInterviewId(interviewId: string) {
    const response = await apiClient.get<ApiSuccessResponse<InterviewFeedbackDto>>(
      `/interviews/${interviewId}/feedback`,
    );
    return response.data.data;
  },

  async submit(interviewId: string, data: SubmitFeedbackDto) {
    const response = await apiClient.post<ApiSuccessResponse<InterviewFeedbackDto>>(
      `/interviews/${interviewId}/feedback`,
      data,
    );
    return response.data.data;
  },
};
