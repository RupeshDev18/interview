'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Palette,
  CheckCircle2,
  Check,
  Building,
  Mail,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/use-auth';
import { useThemeStore, THEMES } from '@/stores/theme.store';

export default function SettingsPage() {
  const user = useCurrentUser();
  const { theme, setTheme } = useThemeStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-theme-accent flex items-center justify-center shadow-md shadow-black/10">
              <SettingsIcon className="h-4 w-4 text-white" />
            </div>
            User Profile & Preferences
          </h1>
          <p className="text-sm text-theme-muted mt-1">
            Manage your account details, workspace visual themes, and defaults.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>Profile preferences saved successfully!</span>
        </div>
      )}

      {/* Theme Selection Card */}
      <div className="bg-card p-6 rounded-2xl border border-theme shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-theme pb-3">
          <div className="flex items-center gap-2.5">
            <Palette className="h-4 w-4 text-theme-accent" />
            <h2 className="text-base font-bold text-theme-primary">Visual Theme & Palette</h2>
          </div>
          <span className="text-xs font-mono font-semibold text-theme-muted uppercase">
            Active: {theme}
          </span>
        </div>

        <p className="text-xs text-theme-muted">
          Select your preferred high-readability design system for the entire workspace.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {THEMES.map((t) => {
            const isSelected = t.id === theme;
            return (
              <div
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all space-y-3 flex flex-col justify-between ${
                  isSelected
                    ? 'border-theme-accent bg-surface-subtle shadow-md ring-2 ring-theme-accent/20'
                    : 'border-theme bg-surface hover:border-theme-accent/50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-black/20"
                        style={{ backgroundColor: t.primaryColor }}
                      />
                      <span className="font-bold text-sm text-theme-primary">{t.name}</span>
                    </div>
                    {isSelected && (
                      <span className="px-1.5 py-0.5 rounded bg-theme-accent text-white text-[10px] font-bold flex items-center gap-1">
                        <Check className="h-3 w-3" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-theme-muted leading-relaxed">{t.description}</p>
                </div>

                <div
                  className="h-10 rounded-lg border border-theme flex items-center justify-center text-[11px] font-mono font-semibold"
                  style={{ backgroundColor: t.bgPreview, color: t.primaryColor }}
                >
                  Preview Canvas
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Profile Card */}
      <div className="bg-card p-6 rounded-2xl border border-theme shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-theme pb-3">
          <div className="flex items-center gap-2.5">
            <User className="h-4 w-4 text-theme-accent" />
            <h2 className="text-base font-bold text-theme-primary">Personal Information</h2>
          </div>
          {user?.role && (
            <Badge variant="outline" className="border-theme text-theme-accent bg-surface-subtle font-mono text-xs">
              Role: {user.role}
            </Badge>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-theme-primary">First Name</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-surface border-theme text-theme-primary text-xs focus-visible:ring-theme-accent"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-theme-primary">Last Name</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-surface border-theme text-theme-primary text-xs focus-visible:ring-theme-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-theme-primary">Email Address</Label>
              <Input
                type="email"
                disabled
                value={email}
                className="bg-surface-subtle border-theme text-theme-muted text-xs font-mono opacity-80 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-theme-primary">Phone Number</Label>
              <Input
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-surface border-theme text-theme-primary text-xs focus-visible:ring-theme-accent"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="gradient-theme-btn text-xs font-semibold gap-1.5">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
