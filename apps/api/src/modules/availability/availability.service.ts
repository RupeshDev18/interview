import { addDays, format } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { availabilityRepository } from './availability.repository';
import { interviewersRepository } from '../interviewers/interviewers.repository';
import { interviewsRepository } from '../interviews/interviews.repository';
import { AuthorizationError, NotFoundError } from '../../utils/errors';
import type { ReplaceRulesInput, CreateExceptionInput } from './availability.validator';

type User = { id: string; role: string; companyId?: string };
const canManage = (interviewer: { userId: string; user: { companyId: string | null } }, user: User) =>
  user.role === 'ADMIN' || interviewer.userId === user.id || (user.role !== 'INTERVIEWER' && interviewer.user.companyId === user.companyId);

export const availabilityService = {
  async getInterviewer(id: string, user: User) {
    const interviewer = await interviewersRepository.findById(id);
    if (!interviewer || (user.role !== 'ADMIN' && interviewer.user.companyId !== user.companyId)) throw new NotFoundError('Interviewer');
    return interviewer;
  },
  async getRules(id: string, user: User) { await this.getInterviewer(id, user); return availabilityRepository.listRules(id); },
  async replaceRules(id: string, input: ReplaceRulesInput, user: User) {
    const interviewer = await this.getInterviewer(id, user);
    if (!canManage(interviewer, user)) throw new AuthorizationError('Not authorized to manage this availability');
    return availabilityRepository.replaceRules(id, input.rules);
  },
  async listExceptions(id: string, from: string, to: string, user: User) {
    await this.getInterviewer(id, user);
    return availabilityRepository.listExceptions(id, new Date(from), new Date(to));
  },
  async createException(id: string, input: CreateExceptionInput, user: User) {
    const interviewer = await this.getInterviewer(id, user);
    if (!canManage(interviewer, user)) throw new AuthorizationError('Not authorized to manage this availability');
    return availabilityRepository.createException({ ...input, interviewerId: id, date: new Date(`${input.date}T00:00:00.000Z`) });
  },
  async deleteException(interviewerId: string, id: string, user: User) {
    const interviewer = await this.getInterviewer(interviewerId, user);
    if (!canManage(interviewer, user)) throw new AuthorizationError('Not authorized to manage this availability');
    if (!(await availabilityRepository.deleteException(interviewerId, id)).count) throw new NotFoundError('Availability exception');
  },
  async slots(id: string, from: string, to: string, durationMinutes: number, user: User) {
    const interviewer = await this.getInterviewer(id, user);
    if (!interviewer.isAvailable) return [];
    const start = new Date(from); const end = new Date(to);
    const [rules, exceptions, booked] = await Promise.all([
      availabilityRepository.listRules(id), availabilityRepository.listExceptions(id, start, end),
      interviewsRepository.findOverlappingInterviews({ interviewerId: id, start, end }),
    ]);
    const exceptionFor = (day: string) => exceptions.filter((item) => formatInTimeZone(item.date, 'UTC', 'yyyy-MM-dd') === day);
    const slots: Array<{ start: string; end: string }> = [];
    const firstDay = formatInTimeZone(start, interviewer.timezone, 'yyyy-MM-dd');
    const lastDay = formatInTimeZone(end, interviewer.timezone, 'yyyy-MM-dd');
    for (let day = new Date(`${firstDay}T00:00:00.000Z`); format(day, 'yyyy-MM-dd') <= lastDay; day = addDays(day, 1)) {
      const localDay = format(day, 'yyyy-MM-dd');
      const weekday = day.getUTCDay();
      const today = exceptionFor(localDay);
      const intervals = [
        ...rules.filter((item) => item.dayOfWeek === weekday).map((item) => ({ startTime: item.startTime, endTime: item.endTime })),
        ...today.filter((item) => item.type === 'AVAILABLE' && item.startTime && item.endTime).map((item) => ({ startTime: item.startTime!, endTime: item.endTime! })),
      ];
      for (const rule of intervals) {
        for (let cursor = fromZonedTime(`${localDay}T${rule.startTime}:00`, interviewer.timezone), ruleEnd = fromZonedTime(`${localDay}T${rule.endTime}:00`, interviewer.timezone); cursor.getTime() + durationMinutes * 60000 <= ruleEnd.getTime(); cursor = new Date(cursor.getTime() + durationMinutes * 60000)) {
          const slotEnd = new Date(cursor.getTime() + durationMinutes * 60000);
          if (cursor < start || slotEnd > end || booked.some((item) => item.scheduledStart < slotEnd && item.scheduledEnd > cursor)) continue;
          const unavailable = today.some((item) => item.type === 'UNAVAILABLE' && (!item.startTime || (formatInTimeZone(cursor, interviewer.timezone, 'HH:mm') < item.endTime! && formatInTimeZone(slotEnd, interviewer.timezone, 'HH:mm') > item.startTime!)));
          if (!unavailable && !slots.some((slot) => slot.start === cursor.toISOString())) slots.push({ start: cursor.toISOString(), end: slotEnd.toISOString() });
        }
      }
    }
    return slots;
  },
};
