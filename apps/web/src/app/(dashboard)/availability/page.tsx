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
  const rules = useQuery({ queryKey: ['availability', interviewerId, 'rules'], queryFn: () => interviewersService.getAvailabilityRules(interviewerId!), enabled: !!interviewerId });
  const exceptions = useQuery({ queryKey: ['availability', interviewerId, 'exceptions'], queryFn: () => interviewersService.getAvailabilityExceptions(interviewerId!, `${today}T00:00:00.000Z`, `${monthEnd}T23:59:59.999Z`), enabled: !!interviewerId });
  const [draft, setDraft] = useState<RuleDraft[] | null>(null);
  const currentRules = draft ?? rules.data?.map(({ id: _id, ...rule }) => rule) ?? [];
  const rulesByDay = useMemo(() => DAYS.map((_, dayOfWeek) => currentRules.filter((r) => r.dayOfWeek === dayOfWeek)), [currentRules]);
  const invalidate = () => client.invalidateQueries({ queryKey: ['availability', interviewerId] });
  const saveRules = useMutation({ mutationFn: () => interviewersService.replaceAvailabilityRules(interviewerId!, currentRules), onSuccess: () => { setDraft(null); invalidate(); toast({ title: 'Availability saved' }); }, onError: () => toast({ title: 'Could not save availability', variant: 'destructive' }) });
  const addException = useMutation({ mutationFn: () => interviewersService.addAvailabilityException(interviewerId!, { date: exceptionDate, type: 'UNAVAILABLE', reason: reason || undefined }), onSuccess: () => { setReason(''); invalidate(); toast({ title: 'Date blocked' }); }, onError: () => toast({ title: 'Could not block date', variant: 'destructive' }) });
  const removeException = useMutation({ mutationFn: (id: string) => interviewersService.deleteAvailabilityException(interviewerId!, id), onSuccess: invalidate });
  const editRules = (update: (items: RuleDraft[]) => RuleDraft[]) => setDraft(update([...currentRules]));

  if (mine.isLoading || rules.isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-96 w-full" /></div>;
  if (!mine.data) return <div className="rounded-xl border border-[#36271D] bg-[#18110C] p-8 text-stone-300">Your account is not linked to an interviewer profile.</div>;

  return <div className="mx-auto max-w-5xl space-y-6 pb-12">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-bold text-sunset-cream"><Clock3 className="text-sunset-orange" /> Availability</h1><p className="mt-1 text-sm text-stone-400">Set your weekly working hours in {mine.data.timezone}.</p></div><Button onClick={() => saveRules.mutate()} disabled={saveRules.isPending} className="bg-sunset-orange text-white hover:bg-sunset-crimson"><Save className="mr-2 h-4 w-4" />Save schedule</Button></div>
    <section className="overflow-hidden rounded-xl border border-[#36271D] bg-[#18110C]"><div className="grid grid-cols-[130px_1fr] border-b border-[#36271D] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-stone-400"><span>Day</span><span>Working hours</span></div>{DAYS.map((day, dayOfWeek) => <div key={day} className="grid grid-cols-[130px_1fr] border-b border-[#36271D] px-5 py-3 last:border-0"><span className="pt-2 text-sm font-medium text-sunset-cream">{day}</span><div className="space-y-2">{rulesByDay[dayOfWeek].map((rule, index) => <div key={`${day}-${index}`} className="flex items-center gap-2"><Input type="time" value={rule.startTime} onChange={(e) => editRules((items) => items.map((item) => item === rule ? { ...item, startTime: e.target.value } : item))} className="w-32 bg-[#120B07]" /><span className="text-stone-500">to</span><Input type="time" value={rule.endTime} onChange={(e) => editRules((items) => items.map((item) => item === rule ? { ...item, endTime: e.target.value } : item))} className="w-32 bg-[#120B07]" /><Button variant="ghost" size="icon" onClick={() => editRules((items) => items.filter((item) => item !== rule))}><Trash2 className="h-4 w-4 text-stone-400" /></Button></div>)}<Button variant="outline" size="sm" onClick={() => editRules((items) => [...items, { dayOfWeek, startTime: '09:00', endTime: '17:00', timezone: mine.data!.timezone }])}><Plus className="mr-1 h-3.5 w-3.5" />Add hours</Button></div></div>)}</section>
    <section className="rounded-xl border border-[#36271D] bg-[#18110C] p-5"><h2 className="flex items-center gap-2 font-bold text-sunset-cream"><CalendarOff className="h-4 w-4 text-sunset-orange" />Block dates</h2><div className="mt-4 flex flex-wrap gap-2"><Input type="date" value={exceptionDate} onChange={(e) => setExceptionDate(e.target.value)} className="w-44 bg-[#120B07]" /><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className="max-w-sm bg-[#120B07]" /><Button onClick={() => addException.mutate()} disabled={addException.isPending}>Block date</Button></div><div className="mt-4 space-y-2">{exceptions.data?.length ? exceptions.data.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg bg-[#120B07] px-3 py-2 text-sm"><span className="text-stone-200">{new Date(item.date).toLocaleDateString()} <span className="text-stone-500">{item.reason && `— ${item.reason}`}</span></span><Button variant="ghost" size="sm" onClick={() => removeException.mutate(item.id)}>Remove</Button></div>) : <p className="text-sm text-stone-500">No blocked dates in the next 30 days.</p>}</div></section>
  </div>;
}
