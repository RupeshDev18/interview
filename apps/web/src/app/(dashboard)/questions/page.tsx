'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Search, Trash2, Tag, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { questionsService, type QuestionInput } from '@/services/questions.service';
import { Difficulty } from '@intvwplt/shared';

const empty: QuestionInput = {
  category: '',
  technology: '',
  question: '',
  expectedAnswer: '',
  difficulty: Difficulty.MEDIUM,
  tags: [],
};

export default function QuestionBankPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const q = useQuery({
    queryKey: ['questions', search, category],
    queryFn: () => questionsService.list({ search: search || undefined, category: category || undefined }),
  });

  const cats = useQuery({
    queryKey: ['question-categories'],
    queryFn: questionsService.categories,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['questions'] });
    qc.invalidateQueries({ queryKey: ['question-categories'] });
  };

  const create = useMutation({
    mutationFn: () => questionsService.create(form),
    onSuccess: () => {
      setForm(empty);
      setOpen(false);
      refresh();
      toast({ title: 'Question added to bank' });
    },
    onError: () => toast({ title: 'Could not add question', variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: questionsService.remove,
    onSuccess: refresh,
  });

  const getDifficultyBadge = (diff: Difficulty) => {
    switch (diff) {
      case Difficulty.EASY:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case Difficulty.HARD:
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      default:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-theme-primary">
            <div className="w-8 h-8 rounded-lg bg-theme-accent flex items-center justify-center text-white shadow-md shadow-black/10">
              <BookOpen className="h-4 w-4" />
            </div>
            Technical Question Bank & Rubrics
          </h1>
          <p className="text-sm text-theme-muted mt-1">
            Standardized technical interview questions, grading criteria, and rubrics.
          </p>
        </div>
        <Button onClick={() => setOpen(!open)} className="gradient-theme-btn font-semibold gap-1.5 text-xs">
          <Plus className="h-4 w-4" /> Add Question
        </Button>
      </div>

      {/* Add Form Accordion */}
      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="space-y-4 rounded-xl border border-theme bg-card p-5 shadow-sm"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              required
              placeholder="Category (e.g. Algorithms, System Design)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="bg-surface border-theme text-theme-primary text-xs"
            />
            <Input
              placeholder="Technology / Domain (e.g. React, PostgreSQL, Docker)"
              value={form.technology ?? ''}
              onChange={(e) => setForm({ ...form, technology: e.target.value })}
              className="bg-surface border-theme text-theme-primary text-xs"
            />
          </div>

          <textarea
            required
            minLength={5}
            value={form.question}
            placeholder="Technical question prompt..."
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            className="min-h-24 w-full rounded-lg border border-theme bg-surface p-3 text-xs text-theme-primary placeholder:text-theme-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-theme-accent"
          />

          <textarea
            value={form.expectedAnswer ?? ''}
            placeholder="Expected answer, key evaluation points, and rubric..."
            onChange={(e) => setForm({ ...form, expectedAnswer: e.target.value })}
            className="min-h-20 w-full rounded-lg border border-theme bg-surface p-3 text-xs text-theme-primary placeholder:text-theme-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-theme-accent"
          />

          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}
              className="rounded-lg bg-surface border border-theme p-2 text-xs text-theme-primary"
            >
              {Object.values(Difficulty).map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
            <Input
              placeholder="Tags, comma separated (e.g. concurrency, caching)"
              onChange={(e) =>
                setForm({
                  ...form,
                  tags: e.target.value
                    .split(',')
                    .map((x) => x.trim())
                    .filter(Boolean),
                })
              }
              className="flex-1 bg-surface border-theme text-theme-primary text-xs"
            />
            <Button type="submit" disabled={create.isPending} className="gradient-theme-btn text-xs font-semibold">
              {create.isPending ? 'Saving...' : 'Save Question'}
            </Button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-theme bg-card p-4 shadow-sm items-center">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-muted" />
          <Input
            className="pl-9 bg-surface border-theme text-theme-primary placeholder:text-theme-muted text-xs"
            placeholder="Search questions by keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg bg-surface border border-theme p-2 text-xs text-theme-primary"
        >
          <option value="">All Categories</option>
          {cats.data?.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>

      {/* Questions Grid */}
      {q.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-40 rounded-xl bg-card border border-theme p-5 animate-pulse" />
          ))}
        </div>
      ) : q.data?.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-xl border border-theme shadow-sm">
          <BookOpen className="h-10 w-10 text-theme-muted mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-bold text-theme-primary">No questions found</h3>
          <p className="text-xs text-theme-muted mt-1">Try another search keyword or create a new question.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {q.data?.map((x) => (
            <article key={x.id} className="rounded-xl border border-theme bg-card p-5 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-theme-accent font-mono">
                      {x.category}
                      {x.technology && ` · ${x.technology}`}
                    </span>
                    <h2 className="font-semibold text-sm text-theme-primary leading-snug">{x.question}</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove.mutate(x.id)}
                    className="text-theme-muted hover:text-rose-500 hover:bg-surface-subtle h-7 w-7 shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {x.expectedAnswer && (
                  <p className="text-xs text-theme-muted mt-2 bg-surface-subtle p-2.5 rounded-lg border border-theme leading-relaxed">
                    <strong className="text-theme-primary">Rubric:</strong> {x.expectedAnswer}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-theme">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono ${getDifficultyBadge(x.difficulty)}`}>
                  {x.difficulty}
                </span>

                {x.tags && x.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {x.tags.map((t) => (
                      <span key={t} className="text-[10px] bg-surface-subtle text-theme-muted px-1.5 py-0.5 rounded border border-theme">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
