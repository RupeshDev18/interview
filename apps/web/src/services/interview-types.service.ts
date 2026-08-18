import { apiClient } from '@/lib/api-client';
import type {
  InterviewTypeDto,
  EvaluationTemplateDto,
  ApiSuccessResponse,
} from '@intvwplt/shared';

export const interviewTypesService = {
  async list() {
    const response = await apiClient.get<any>(
      '/interview-types',
    );
    const body = response.data;
    if (Array.isArray(body?.data)) return body.data as InterviewTypeDto[];
    if (Array.isArray(body)) return body as InterviewTypeDto[];
    return [];
  },

  async listTemplates() {
    const response = await apiClient.get<any>(
      '/interview-types/templates',
    );
    const body = response.data;
    if (Array.isArray(body?.data)) return body.data as EvaluationTemplateDto[];
    if (Array.isArray(body)) return body as EvaluationTemplateDto[];
    return [];
  },
};
