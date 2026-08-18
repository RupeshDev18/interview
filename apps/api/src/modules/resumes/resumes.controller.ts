import type { Request, Response } from 'express';
import { resumesService } from './resumes.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response';
import { ValidationError } from '../../utils/errors';

export const resumesController = {
  async upload(req: Request, res: Response) {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const candidateId = req.params.candidateId as string;
    const resume = await resumesService.upload(
      candidateId,
      req.file,
      req.user!,
    );
    sendCreated(res, resume, 'Resume uploaded successfully');
  },

  async list(req: Request, res: Response) {
    const candidateId = req.params.candidateId as string;
    const resumes = await resumesService.listForCandidate(candidateId, req.user!);
    sendSuccess(res, resumes);
  },

  async getSignedUrl(req: Request, res: Response) {
    const resumeId = req.params.resumeId as string;
    const url = await resumesService.getSignedDownloadUrl(resumeId, req.user!);
    sendSuccess(res, { url, expiresInSeconds: 3600 });
  },

  async delete(req: Request, res: Response) {
    const resumeId = req.params.resumeId as string;
    await resumesService.delete(resumeId, req.user!);
    sendNoContent(res);
  },
};
