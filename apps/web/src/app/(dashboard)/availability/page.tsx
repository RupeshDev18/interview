'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarOff, Clock3, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { interviewersService } from '@/services/interviewers.service';
import { toast } from '@/hooks/use-toast';
import type { AvailabilityRuleDto } from '@intvwplt/shared';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
type RuleDraft = Omit<AvailabilityRuleDto, 'id'>;
const today = new Date().toISOString().slice(0, 10);
const monthEnd = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

export default function AvailabilityPage() {
  const client = useQueryClient();
  const [exceptionDate, setExceptionDate] = useState(today);
  const [reason, setReason] = useState('');
  const mine = useQuery({ queryKey: ['interviewer', 'me'], queryFn: interviewersService.getMine });
  const interviewerId = mine.data?.id;
  const rules = useQuery({
    queryKey: ['availability', interviewerId, 'rules'],
    queryFn: () => interviewersService.getAvailabilityRules(interviewerId!),
    enabled: !!interviewerId,
  });
  const exceptions = useQuery({
    queryKey: ['availability', interviewerId, 'exceptions'],
    queryFn: () =>
      interviewersService.getAvailabilityExceptions(
        interviewerId!,
        `${today}T00:00:00.000Z`,
        `${monthEnd}T23:59:59.999Z`,
      ),
    enabled: !!interviewerId,
  });
  const [draft, setDraft] = useState<RuleDraft[] | null>(null);
  const currentRules = draft ?? rules.data?.map(({ id: _id, ...rule }) => rule) ?? [];
  const rulesByDay = useMemo(
    () => DAYS.map((_, dayOfWeek) => currentRules.filter((r) => r.dayOfWeek === dayOfWeek)),
    [currentRules],
  );
  const invalidate = () => client.invalidateQueries({ queryKey: ['availability', interviewerId] });
  const saveRules = useMutation({
    mutationFn: () => interviewersService.replaceAvailabilityRules(interviewerId!, currentRules),
    onSuccess: () => {
      setDraft(null);
      invalidate();
      toast({ title: 'Availability saved' });
    },
    onError: () => toast({ title: 'Could not save availability', variant: 'destructive' }),
  });
  const addException = useMutation({
    mutationFn: () =>
      interviewersService.addAvailabilityException(interviewerId!, {
        date: exceptionDate,
        type: 'UNAVAILABLE',
        reason: reason || undefined,
      }),
    onSuccess: () => {
      setReason('');
      invalidate();
      toast({ title: 'Date blocked' });
    },
    onError: () => toast({ title: 'Could not block date', variant: 'destructive' }),
  });
  const removeException = useMutation({
    mutationFn: (id: string) => interviewersService.deleteAvailabilityException(interviewerId!, id),
    onSuccess: invalidate,
  });
  const editRules = (update: (items: RuleDraft[]) => RuleDraft[]) => setDraft(update([...currentRules]));

  if (mine.isLoading || rules.isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  if (!mine.data)
    return (
      <div className="rounded-xl border border-theme bg-card p-8 text-theme-muted">
        Your account is not linked to an interviewer profile.
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-theme-primary">
            <div className="w-8 h-8 rounded-lg bg-theme-accent flex items-center justify-center text-white shadow-md shadow-black/10">
              <Clock3 className="h-4 w-4" />
            </div>
            Interviewer Availability & Working Hours
          </h1>
          <p className="mt-1 text-sm text-theme-muted">
            Set your recurring weekly working hours in timezone: <strong className="text-theme-primary">{mine.data.timezone}</strong>.
          </p>
        </div>
        <Button
          onClick={() => saveRules.mutate()}
          disabled={saveRules.isPending}
          className="gradient-theme-btn font-semibold text-xs gap-1.5"
        >
          <Save className="h-4 w-4" />
          {saveRules.isPending ? 'Saving...' : 'Save Schedule'}
        </Button>
      </div>

      <section className="overflow-hidden rounded-xl border border-theme bg-card shadow-sm">
        <div className="grid grid-cols-[130px_1fr] border-b border-theme bg-surface-subtle px-5 py-3 text-xs font-semibold uppercase tracking-wide text-theme-muted">
          <span>Day</span>
          <span>Working Hours</span>
        </div>
        {DAYS.map((day, dayOfWeek) => (
          <div key={day} className="grid grid-cols-[130px_1fr] border-b border-theme px-5 py-3.5 last:border-0 items-start">
            <span className="pt-2 text-sm font-medium text-theme-primary">{day}</span>
            <div className="space-y-2">
              {rulesByDay[dayOfWeek].map((rule, index) => (
                <div key={`${day}-${index}`} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={rule.startTime}
                    onChange={(e) =>
                      editRules((items) =>
                        items.map((item) => (item === rule ? { ...item, startTime: e.target.value } : item)),
                      )
                    }
                    className="w-32 bg-surface border-theme text-theme-primary text-xs"
                  />
                  <span className="text-theme-muted text-xs">to</span>
                  <Input
                    type="time"
                    value={rule.endTime}
                    onChange={(e) =>
                      editRules((items) =>
                        items.map((item) => (item === rule ? { ...item, endTime: e.target.value } : item)),
                      )
                    }
                    className="w-32 bg-surface border-theme text-theme-primary text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => editRules((items) => items.filter((item) => item !== rule))}
                    className="text-theme-muted hover:text-rose-500 h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  editRules((items) => [
                    ...items,
                    { dayOfWeek, startTime: '09:00', endTime: '17:00', timezone: mine.data!.timezone },
                  ])
                }
                className="text-xs border-theme bg-surface hover:bg-surface-subtle text-theme-primary h-7"
              >
                <Plus className="mr-1 h-3.5 w-3.5 text-theme-accent" />
                Add hours
              </Button>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-theme bg-card p-5 shadow-sm space-y-4">
        <h2 className="flex items-center gap-2 font-bold text-theme-primary text-base">
          <CalendarOff className="h-4 w-4 text-theme-accent" />
          Block Specific Dates / Time Off
        </h2>
        <div className="flex flex-wrap gap-2">
          <Input
            type="date"
            value={exceptionDate}
            onChange={(e) => setExceptionDate(e.target.value)}
            className="w-44 bg-surface border-theme text-theme-primary text-xs"
          />
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional, e.g. Vacation)"
            className="max-w-sm bg-surface border-theme text-theme-primary text-xs"
          />
          <Button
            onClick={() => addException.mutate()}
            disabled={addException.isPending}
            variant="outline"
            className="text-xs border-theme bg-surface hover:bg-surface-subtle text-theme-primary"
          >
            Block Date
          </Button>
        </div>
        <div className="space-y-2">
          {exceptions.data?.length ? (
            exceptions.data.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg bg-surface-subtle border border-theme px-3 py-2 text-xs"
              >
                <span className="text-theme-primary font-medium">
                  {new Date(item.date).toLocaleDateString()}{' '}
                  <span className="text-theme-muted font-normal">{item.reason && `— ${item.reason}`}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeException.mutate(item.id)}
                  className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-6 px-2"
                >
                  Remove
                </Button>
              </div>
            ))
          ) : (
            <p className="text-xs text-theme-muted">No blocked dates in the next 30 days.</p>
          )}
        </div>
      </section>
    </div>
  );
}
