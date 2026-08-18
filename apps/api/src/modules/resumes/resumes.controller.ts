import type { Request, Response } from 'express';
import { resumesService } from './resumes.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response';
import { ValidationError } from '../../utils/errors';

export const resumesController = {
  async upload(req: Request, res: Response) {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const resume = await resumesService.upload(
      req.params.candidateId,
      req.file,
      req.user!,
    );
    sendCreated(res, resume, 'Resume uploaded successfully');
  },

  async list(req: Request, res: Response) {
    const resumes = await resumesService.listForCandidate(req.params.candidateId, req.user!);
    sendSuccess(res, resumes);
  },

  async getSignedUrl(req: Request, res: Response) {
    const url = await resumesService.getSignedDownloadUrl(req.params.resumeId, req.user!);
    sendSuccess(res, { url, expiresInSeconds: 3600 });
  },

  async delete(req: Request, res: Response) {
    await resumesService.delete(req.params.resumeId, req.user!);
    sendNoContent(res);
  },
};
