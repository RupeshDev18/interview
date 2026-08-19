import { prisma } from '../../lib/prisma';
import type { AvailabilityExceptionType } from '@prisma/client';

export const availabilityRepository = {
  async listRules(interviewerId: string) { return prisma.availabilityRule.findMany({ where: { interviewerId, isActive: true }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] }); },
  async replaceRules(interviewerId: string, rules: Array<{ dayOfWeek: number; startTime: string; endTime: string; timezone: string }>) {
    return prisma.$transaction(async (tx) => {
      await tx.availabilityRule.deleteMany({ where: { interviewerId } });
      if (rules.length) await tx.availabilityRule.createMany({ data: rules.map((rule) => ({ ...rule, interviewerId })) });
      return tx.availabilityRule.findMany({ where: { interviewerId }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] });
    });
  },
  async listExceptions(interviewerId: string, from: Date, to: Date) { return prisma.availabilityException.findMany({ where: { interviewerId, date: { gte: from, lte: to } }, orderBy: { date: 'asc' } }); },
  async createException(data: { interviewerId: string; date: Date; startTime?: string; endTime?: string; type: AvailabilityExceptionType; reason?: string }) { return prisma.availabilityException.create({ data }); },
  async deleteException(interviewerId: string, id: string) { return prisma.availabilityException.deleteMany({ where: { id, interviewerId } }); },
};
