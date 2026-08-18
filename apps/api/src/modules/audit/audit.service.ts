import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import type { AuditAction } from '@intvwplt/shared';

interface AuditLogInput {
  actorId?: string;
  companyId?: string;
  action: AuditAction | string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export const auditService = {
  /**
   * Fire-and-forget audit log. Never throws — failures are logged, not propagated.
   * In Phase 9 this will be replaced with a Kafka event.
   */
  async log(input: AuditLogInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: input.actorId,
          companyId: input.companyId,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: input.metadata as object,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });
    } catch (err) {
      // Audit failure must never break the main request
      logger.error('Failed to write audit log', { error: err, action: input.action });
    }
  },
};
