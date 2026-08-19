import { z } from 'zod';
import { AvailabilityExceptionType } from '@intvwplt/shared';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM (24-hour)');

export const replaceRulesSchema = z.object({
  rules: z.array(z.object({ dayOfWeek: z.number().int().min(0).max(6), startTime: time, endTime: time, timezone: z.string().min(1).max(100) })
    .refine((rule) => rule.startTime < rule.endTime, { message: 'endTime must be after startTime', path: ['endTime'] })).max(50),
});

export const createExceptionSchema = z.object({
  date: z.string().date(),
  startTime: time.optional(),
  endTime: time.optional(),
  type: z.nativeEnum(AvailabilityExceptionType),
  reason: z.string().max(500).optional(),
}).refine((item) => Boolean(item.startTime) === Boolean(item.endTime), { message: 'Provide both startTime and endTime, or neither' })
  .refine((item) => !item.startTime || !item.endTime || item.startTime < item.endTime, { message: 'endTime must be after startTime', path: ['endTime'] });

export const slotsQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  durationMinutes: z.coerce.number().int().min(15).max(480).default(60),
});

export const dateRangeQuerySchema = slotsQuerySchema.pick({ from: true, to: true });

export type ReplaceRulesInput = z.infer<typeof replaceRulesSchema>;
export type CreateExceptionInput = z.infer<typeof createExceptionSchema>;
