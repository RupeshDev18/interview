import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { prisma } from '../../lib/prisma';
import { uploadToS3, generatePresignedDownloadUrl, deleteS3Object } from '../../lib/s3';
import { NotFoundError, ValidationError, AuthorizationError } from '../../utils/errors';
import { auditService } from '../audit/audit.service';
import { AuditAction } from '@intvwplt/shared';
import {
  ALLOWED_RESUME_MIME_TYPES,
  ALLOWED_RESUME_EXTENSIONS,
  MAX_RESUME_SIZE_BYTES,
} from '@intvwplt/shared';
import { env } from '../../config/env';

interface RequestingUser {
  id: string;
  role: string;
  companyId?: string;
}

export const resumesService = {
  async upload(
    candidateId: string,
    file: Express.Multer.File,
    user: RequestingUser,
  ) {
    // Validate MIME type
    if (!ALLOWED_RESUME_MIME_TYPES.includes(file.mimetype)) {
      throw new ValidationError(
        `Invalid file type. Allowed types: PDF, DOC, DOCX`,
      );
    }

    // Validate extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_RESUME_EXTENSIONS.includes(ext)) {
      throw new ValidationError(`Invalid file extension. Allowed: ${ALLOWED_RESUME_EXTENSIONS.join(', ')}`);
    }

    // Validate size
    const maxBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new ValidationError(`File too large. Maximum size: ${env.MAX_FILE_SIZE_MB}MB`);
    }

    // Ensure candidate exists and user can access it
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        deletedAt: null,
        ...(user.role !== 'ADMIN' && { companyId: user.companyId }),
      },
    });
    if (!candidate) throw new NotFoundError('Candidate');

    // Deactivate previous resumes (keep history, but only one active)
    await prisma.resume.updateMany({
      where: { candidateId, isActive: true },
      data: { isActive: false },
    });

    // Upload to S3
    const storageKey = `resumes/${candidate.companyId}/${candidateId}/${uuidv4()}${ext}`;
    const fileUrl = await uploadToS3(file.buffer, storageKey, file.mimetype);

    // Persist record
    const resume = await prisma.resume.create({
      data: {
        candidateId,
        uploadedById: user.id,
        fileName: file.originalname,
        fileUrl,
        storageKey,
        mimeType: file.mimetype,
        fileSize: file.size,
        isActive: true,
      },
    });

    await auditService.log({
      actorId: user.id,
      companyId: candidate.companyId,
      action: AuditAction.RESUME_UPLOADED,
      entityType: 'Resume',
      entityId: resume.id,
      metadata: { candidateId, fileName: file.originalname, fileSize: file.size },
    });

    return resume;
  },

  async getSignedDownloadUrl(resumeId: string, user: RequestingUser): Promise<string> {
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: { candidate: { select: { companyId: true } } },
    });

    if (!resume) throw new NotFoundError('Resume');

    // Authorization: non-admin can only access resumes from their company
    if (user.role !== 'ADMIN' && resume.candidate.companyId !== user.companyId) {
      throw new AuthorizationError('Access denied to this resume');
    }

    return generatePresignedDownloadUrl(resume.storageKey, 3600);
  },

  async listForCandidate(candidateId: string, user: RequestingUser) {
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        deletedAt: null,
        ...(user.role !== 'ADMIN' && { companyId: user.companyId }),
      },
    });
    if (!candidate) throw new NotFoundError('Candidate');

    return prisma.resume.findMany({
      where: { candidateId },
      orderBy: { uploadedAt: 'desc' },
    });
  },

  async delete(resumeId: string, user: RequestingUser) {
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: { candidate: { select: { companyId: true } } },
    });
    if (!resume) throw new NotFoundError('Resume');

    if (user.role !== 'ADMIN' && resume.candidate.companyId !== user.companyId) {
      throw new AuthorizationError('Access denied');
    }

    await deleteS3Object(resume.storageKey);
    await prisma.resume.delete({ where: { id: resumeId } });
  },
};
