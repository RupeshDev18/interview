import { apiClient } from '@/lib/api-client';
import type { Difficulty } from '@intvwplt/shared';
export interface QuestionDto { id: string; category: string; technology?: string | null; question: string; expectedAnswer?: string | null; difficulty: Difficulty; tags: string[]; }
export type QuestionInput = Pick<QuestionDto, 'category' | 'technology' | 'question' | 'expectedAnswer' | 'difficulty' | 'tags'>;
export const questionsService = {
  async list(params: { search?: string; category?: string } = {}) { const r = await apiClient.get('/questions', { params }); return (r.data.items ?? r.data.data ?? []) as QuestionDto[]; },
  async categories() { return (await apiClient.get('/questions/categories')).data.data as string[]; },
  async create(input: QuestionInput) { return (await apiClient.post('/questions', input)).data.data as QuestionDto; },
  async remove(id: string) { await apiClient.delete(`/questions/${id}`); },
};
