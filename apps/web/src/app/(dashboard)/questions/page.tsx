'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Tag,
  Star,
  Layers,
  Code2,
  Database,
  Globe,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface QuestionItem {
  id: string;
  title: string;
  category: 'DSA' | 'System Design' | 'Frontend' | 'Backend' | 'Behavioral';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  sampleRubric: string;
}

const DEFAULT_QUESTIONS: QuestionItem[] = [
  {
    id: '1',
    title: 'Design a Distributed Rate Limiter',
    category: 'System Design',
    difficulty: 'Medium',
    description: 'Design a resilient rate limiter supporting 100k RPS using Token Bucket or Sliding Window Log with Redis clusters.',
    sampleRubric: 'Evaluates concurrency handling, memory footprint, and network latency trade-offs.',
  },
  {
    id: '2',
    title: 'Implement LRU Cache with O(1) Operations',
    category: 'DSA',
    difficulty: 'Medium',
    description: 'Implement a Least Recently Used (LRU) Cache with get() and put() in O(1) time complexity using Doubly Linked List and Hash Map.',
    sampleRubric: 'Tests clean pointer manipulation and boundary condition checks.',
  },
  {
    id: '3',
    title: 'Explain JavaScript Event Loop & Microtasks',
    category: 'Frontend',
    difficulty: 'Easy',
    description: 'Walk through call stack execution order with Promise.then vs setTimeout vs requestAnimationFrame.',
    sampleRubric: 'Evaluates async mental model and deep browser rendering pipeline knowledge.',
  },
  {
    id: '4',
    title: 'PostgreSQL Database Indexing & Query Optimization',
    category: 'Backend',
    difficulty: 'Hard',
    description: 'Diagnose a slow analytical query using EXPLAIN ANALYZE, composite indexes, and index scan vs seq scan trade-offs.',
    sampleRubric: 'Assesses indexing mechanics, B-trees, selectivity, and query execution plans.',
  },
];

export default function QuestionBankPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [questions, setQuestions] = useState<QuestionItem[]>(DEFAULT_QUESTIONS);

  // Add question state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<QuestionItem['category']>('DSA');
  const [newDifficulty, setNewDifficulty] = useState<QuestionItem['difficulty']>('Medium');
  const [newDesc, setNewDesc] = useState('');

  const categories = ['All', 'DSA', 'System Design', 'Frontend', 'Backend', 'Behavioral'];

  const filteredQuestions = questions.filter((q) => {
    const matchesCat = selectedCategory === 'All' || q.category === selectedCategory;
    const matchesSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newQ: QuestionItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      category: newCategory,
      difficulty: newDifficulty,
      description: newDesc.trim() || 'No description provided.',
      sampleRubric: 'Evaluates correctness and algorithmic complexity.',
    };

    setQuestions([newQ, ...questions]);
    setNewTitle('');
    setNewDesc('');
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Medium':
        return 'bg-sunset-amber/15 text-sunset-amber border-sunset-amber/30';
      case 'Hard':
        return 'bg-sunset-crimson/15 text-rose-300 border-sunset-crimson/30';
      default:
        return 'bg-stone-800 text-stone-300';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sunset-cream flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sunset-orange to-sunset-crimson flex items-center justify-center shadow-md shadow-sunset-orange/20">
              <BookOpen className="h-4 w-4 text-sunset-cream" />
            </div>
            Technical Question Bank & Rubrics
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Curated technical problems, system design architectures, and evaluation rubrics for interviewers.
          </p>
        </div>

        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="gradient-sunset-btn text-xs font-semibold gap-1.5"
        >
          <Plus className="h-4 w-4" /> {showAddForm ? 'Close Form' : 'Add Question'}
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddQuestion}
          className="p-5 rounded-2xl bg-[#18110C] border border-[#36271D] shadow-xl space-y-4 animate-in fade-in"
        >
          <h3 className="text-sm font-bold text-sunset-cream">Create Technical Question</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-stone-300">Question Title *</label>
              <Input
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Design a Real-Time Collaborative Document Editor"
                className="bg-[#120B07] border-[#36271D] text-sunset-cream text-xs focus-visible:ring-sunset-orange"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-300">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full h-10 px-3 rounded-lg bg-[#120B07] border border-[#36271D] text-sunset-cream text-xs focus:outline-none focus:ring-1 focus:ring-sunset-orange"
              >
                <option value="DSA">DSA</option>
                <option value="System Design">System Design</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Behavioral">Behavioral</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-300">Problem Statement & Requirements</label>
            <textarea
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Detailed description, constraints, and sample test cases..."
              className="w-full p-2.5 rounded-lg bg-[#120B07] border border-[#36271D] text-sunset-cream text-xs placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-sunset-orange"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-stone-400"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="gradient-sunset-btn text-xs font-semibold">
              Save to Bank
            </Button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="bg-[#18110C]/90 p-4 rounded-xl border border-[#36271D] space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sunset-amber/60" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems, keywords, or topics..."
            className="pl-9 bg-[#120B07] border-[#36271D] text-sunset-cream placeholder:text-stone-500 focus-visible:ring-sunset-orange focus-visible:border-sunset-orange"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-sm">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-sunset-orange to-sunset-crimson text-sunset-cream shadow-sm'
                    : 'bg-[#231711] text-stone-400 hover:text-sunset-cream'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredQuestions.map((q) => (
          <div
            key={q.id}
            className="p-5 rounded-2xl bg-[#18110C]/90 border border-[#36271D] hover:border-sunset-orange/40 hover:bg-[#20150F] transition-all flex flex-col justify-between space-y-4 group shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-sunset-orange font-mono">
                      {q.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono ${getDifficultyBadge(q.difficulty)}`}>
                      {q.difficulty}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-sunset-cream mt-1 group-hover:text-sunset-amber transition-colors">
                    {q.title}
                  </h3>
                </div>

                <button
                  onClick={() => handleDelete(q.id)}
                  className="text-stone-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="text-xs text-stone-300 mt-2.5 leading-relaxed">
                {q.description}
              </p>
            </div>

            <div className="pt-3 border-t border-[#36271D] flex items-center justify-between text-xs text-stone-400">
              <span className="truncate pr-2 italic text-[11px]">
                Rubric: {q.sampleRubric}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
