import { interviewersRepository } from './interviewers.repository';
import { NotFoundError } from '../../utils/errors';

interface RequestingUser {
  id: string;
  role: string;
  companyId?: string;
}

export const interviewersService = {
  async list(query: { isAvailable?: boolean; search?: string }, user: RequestingUser) {
    const companyId = user.role === 'ADMIN' ? undefined : user.companyId;
    return interviewersRepository.findAll({
      companyId,
      isAvailable: query.isAvailable,
      search: query.search,
    });
  },

  async getById(id: string) {
    const interviewer = await interviewersRepository.findById(id);
    if (!interviewer) throw new NotFoundError('Interviewer');
    return interviewer;
  },

  async getByUserId(userId: string) {
    const interviewer = await interviewersRepository.findByUserId(userId);
    if (!interviewer) throw new NotFoundError('Interviewer profile');
    return interviewer;
  },
};
