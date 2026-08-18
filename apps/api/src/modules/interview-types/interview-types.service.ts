import { interviewTypesRepository } from './interview-types.repository';
import { NotFoundError } from '../../utils/errors';

export const interviewTypesService = {
  async list() {
    return interviewTypesRepository.findAll();
  },

  async getById(id: string) {
    const interviewType = await interviewTypesRepository.findById(id);
    if (!interviewType) throw new NotFoundError('Interview Type');
    return interviewType;
  },

  async listTemplates() {
    return interviewTypesRepository.findAllTemplates();
  },
};
