'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCheck,
  Search,
  Calendar,
  Clock,
  Briefcase,
  Star,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Globe,
  Plus,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { interviewersService, type CreateInterviewerDto } from '@/services/interviewers.service';
import { useAuthStore } from '@/stores/auth.store';
import type { InterviewerSummary } from '@intvwplt/shared';

const PRESET_EXPERTISE = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Next.js',
  'Python',
  'PostgreSQL',
  'MongoDB',
  'System Design',
  'DSA & Algorithms',
  'AWS',
  'Docker',
  'Kubernetes',
  'Java',
  'Spring Boot',
  'Behavioral',
];

export default function InterviewersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const isManagerOrAdmin =
    currentUser?.role === 'ADMIN' || currentUser?.role === 'COMPANY_ADMIN';

  const [search, setSearch] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean | undefined>(undefined);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [form, setForm] = useState<CreateInterviewerDto>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    yearsOfExperience: 3,
    timezone: 'UTC',
    expertise: ['Node.js', 'TypeScript'],
    bio: '',
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['interviewers', { search, onlyAvailable }],
    queryFn: () =>
      interviewersService.list({
        search: search.trim() || undefined,
        isAvailable: onlyAvailable,
      }),
  });

  const interviewers: InterviewerSummary[] = Array.isArray(data) ? data : [];

  const createMutation = useMutation({
    mutationFn: (dto: CreateInterviewerDto) => interviewersService.create(dto),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['interviewers'] });
      setIsAddModalOpen(false);
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        yearsOfExperience: 3,
        timezone: 'UTC',
        expertise: ['Node.js', 'TypeScript'],
        bio: '',
      });
      toast({
        title: 'Interviewer Added',
        description: `Successfully onboarded ${res.user.firstName} ${res.user.lastName} to the evaluation panel.`,
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to Add Interviewer',
        description: err?.response?.data?.error?.message || 'Could not provision interviewer.',
        variant: 'destructive',
      });
    },
  });

  const toggleExpertise = (skill: string) => {
    const current = form.expertise || [];
    if (current.includes(skill)) {
      setForm({ ...form, expertise: current.filter((s) => s !== skill) });
    } else {
      setForm({ ...form, expertise: [...current, skill] });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-theme-accent flex items-center justify-center shadow-md shadow-black/10">
              <UserCheck className="h-4 w-4 text-white" />
            </div>
            Technical Interviewers Panel
          </h1>
          <p className="text-sm text-theme-muted mt-1">
            Manage your organization's technical evaluators, domain expertise, and weekly scheduling availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-theme bg-card text-theme-primary hover:bg-surface-subtle"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin text-theme-accent' : 'text-theme-muted'}`} />
            Refresh
          </Button>

          {isManagerOrAdmin && (
            <Button
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="gradient-theme-btn text-xs font-semibold gap-1.5 shadow-md"
            >
              <Plus className="h-4 w-4" /> Add Technical Interviewer
            </Button>
          )}
        </div>
      </div>

      {/* Search & Availability Toggle */}
      <div className="bg-card p-4 rounded-xl border border-theme flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search interviewers by name, email, or technical expertise..."
            className="pl-9 bg-surface border-theme text-theme-primary placeholder:text-theme-muted focus-visible:ring-theme-accent focus-visible:border-theme-accent text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setOnlyAvailable(undefined)}
            className={`px-3 py-1.5 rounded-full transition-all ${
              onlyAvailable === undefined
                ? 'bg-theme-accent text-white shadow-sm'
                : 'bg-surface text-theme-muted border border-theme hover:border-theme-accent/50 hover:text-theme-primary'
            }`}
          >
            All Evaluators ({interviewers.length})
          </button>
          <button
            onClick={() => setOnlyAvailable(true)}
            className={`px-3 py-1.5 rounded-full transition-all ${
              onlyAvailable === true
                ? 'bg-theme-accent text-white shadow-sm'
                : 'bg-surface text-theme-muted border border-theme hover:border-theme-accent/50 hover:text-theme-primary'
            }`}
          >
            Available Only
          </button>
        </div>
      </div>

      {/* Evaluator Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-card border border-theme p-4 space-y-3">
              <Skeleton className="h-5 w-36 bg-surface-subtle" />
              <Skeleton className="h-4 w-24 bg-surface-subtle" />
              <Skeleton className="h-3 w-full bg-surface-subtle" />
            </div>
          ))}
        </div>
      ) : interviewers.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-theme shadow-sm space-y-3">
          <UserCheck className="h-10 w-10 text-theme-muted mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-theme-primary">No interviewers found</h3>
          <p className="text-xs text-theme-muted">
            {isManagerOrAdmin
              ? 'Onboard technical evaluators to begin scheduling coding and architecture interviews.'
              : 'No evaluators currently match your filter criteria.'}
          </p>
          {isManagerOrAdmin && (
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs gradient-theme-btn mt-2"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Your First Interviewer
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interviewers.map((intv) => (
            <div
              key={intv.id}
              className="p-5 rounded-xl bg-card border border-theme hover:border-theme-accent/40 hover:bg-surface-subtle/40 transition-all flex flex-col justify-between group space-y-4 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-theme-accent/15 border border-theme-accent/30 flex items-center justify-center text-theme-accent font-bold text-sm font-mono">
                      {intv.user.firstName[0]}{intv.user.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-theme-primary group-hover:text-theme-accent transition-colors">
                        {intv.user.firstName} {intv.user.lastName}
                      </h3>
                      <p className="text-xs text-theme-muted font-mono">{intv.user.email}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border font-mono ${
                      intv.isAvailable
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-surface-subtle text-theme-muted border-theme'
                    }`}
                  >
                    {intv.isAvailable ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {intv.isAvailable ? 'Available' : 'Busy'}
                  </span>
                </div>

                {intv.bio && (
                  <p className="text-xs text-theme-muted mt-3 leading-relaxed line-clamp-2">
                    {intv.bio}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-4 text-xs text-theme-muted">
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-theme-accent" />
                    {intv.yearsOfExperience} yrs exp
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Globe className="h-3.5 w-3.5 text-theme-accent" />
                    {intv.timezone}
                  </span>
                </div>

                {intv.expertise && intv.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {intv.expertise.map((exp) => (
                      <span
                        key={exp}
                        className="text-[10px] bg-surface-subtle text-theme-primary px-2 py-0.5 rounded border border-theme font-mono font-medium"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Technical Interviewer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-card border border-theme rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-theme flex items-center justify-between bg-surface-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-theme-accent text-white flex items-center justify-center shadow-sm">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-theme-primary">
                    Add Technical Interviewer
                  </h2>
                  <p className="text-xs text-theme-muted font-mono">
                    Provisions interviewer account and weekly scheduling calendar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-primary">First Name *</label>
                  <Input
                    required
                    placeholder="Alex"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="bg-surface border-theme text-theme-primary text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-primary">Last Name *</label>
                  <Input
                    required
                    placeholder="Morgan"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="bg-surface border-theme text-theme-primary text-xs"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-theme-primary">Work Email *</label>
                  <Input
                    required
                    type="email"
                    placeholder="alex.morgan@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="bg-surface border-theme text-theme-primary text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-primary">Initial Password</label>
                  <Input
                    type="password"
                    placeholder="Leave blank for default (Interviewer@123456)"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="bg-surface border-theme text-theme-primary text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-theme-primary">Years of Experience</label>
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    value={form.yearsOfExperience}
                    onChange={(e) => setForm({ ...form, yearsOfExperience: Number(e.target.value) })}
                    className="bg-surface border-theme text-theme-primary text-xs"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-theme-primary">Timezone</label>
                  <select
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                    className="w-full h-9 rounded-lg bg-surface border border-theme px-3 text-xs text-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-accent"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
                    <option value="America/New_York">America/New_York (EST - UTC-5)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST - UTC-8)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT - UTC+8)</option>
                  </select>
                </div>
              </div>

              {/* Technical Expertise Tags */}
              <div className="space-y-2 pt-2 border-t border-theme">
                <label className="text-xs font-semibold text-theme-primary">Technical Expertise Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_EXPERTISE.map((skill) => {
                    const isSelected = form.expertise?.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleExpertise(skill)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-theme-accent text-white border-theme-accent shadow-sm'
                            : 'bg-surface text-theme-muted border-theme hover:text-theme-primary hover:border-theme-accent/40'
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-theme-primary">Bio / Background Summary</label>
                <textarea
                  rows={2}
                  placeholder="Senior full-stack engineer with 6+ years building distributed cloud applications..."
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-surface border border-theme text-xs text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-accent resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="border-theme text-theme-muted hover:text-theme-primary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="gradient-theme-btn font-semibold text-xs gap-1.5 shadow-md"
                >
                  <Sparkles className="h-4 w-4" />
                  {createMutation.isPending ? 'Provisioning Evaluator…' : 'Add Technical Interviewer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
