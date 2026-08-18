'use client';

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Palette,
  Bell,
  Globe,
  Save,
  CheckCircle2,
  Lock,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const [name, setName] = useState('Admin User');
  const [email, setEmail] = useState('admin@intvwplt.com');
  const [company, setCompany] = useState('Acme Corporation');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');
  const [savedSuccess, setSavedSuccess] = useState(false);

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
          <h1 className="text-2xl font-bold tracking-tight text-sunset-cream flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sunset-orange to-sunset-crimson flex items-center justify-center shadow-md shadow-sunset-orange/20">
              <SettingsIcon className="h-4 w-4 text-sunset-cream" />
            </div>
            Platform Settings & Preferences
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Configure your technical interview workspace, theme, and evaluator defaults.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Section 1: User Profile */}
      <div className="bg-[#18110C]/90 p-6 rounded-2xl border border-[#36271D] shadow-xl space-y-5">
        <div className="flex items-center gap-2.5 border-b border-[#36271D] pb-3">
          <User className="h-4 w-4 text-sunset-orange" />
          <h2 className="text-base font-bold text-sunset-cream">Profile Information</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-300">Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#120B07] border-[#36271D] text-sunset-cream text-xs focus-visible:ring-sunset-orange"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-300">Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#120B07] border-[#36271D] text-sunset-cream text-xs focus-visible:ring-sunset-orange font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-300">Organization / Tenant</Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="bg-[#120B07] border-[#36271D] text-sunset-cream text-xs focus-visible:ring-sunset-orange"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-300">Preferred Timezone</Label>
              <Input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="bg-[#120B07] border-[#36271D] text-sunset-cream text-xs focus-visible:ring-sunset-orange font-mono"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="gradient-sunset-btn text-xs font-semibold gap-1.5">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Section 2: Active Theme Palette */}
      <div className="bg-[#18110C]/90 p-6 rounded-2xl border border-[#36271D] shadow-xl space-y-5">
        <div className="flex items-center gap-2.5 border-b border-[#36271D] pb-3">
          <Palette className="h-4 w-4 text-sunset-amber" />
          <h2 className="text-base font-bold text-sunset-cream">Obsidian Sunset Color Tokens</h2>
        </div>

        <p className="text-xs text-stone-400">
          The platform interface is rendered in real time using the Obsidian Sunset palette.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[#20150F] border border-[#36271D] space-y-2">
            <div className="h-10 rounded-lg bg-[#FBF9E7] border border-stone-300 shadow-inner flex items-center justify-center font-mono text-[10px] text-black font-bold">
              #FBF9E7
            </div>
            <span className="text-xs font-bold text-sunset-cream block">Soft Cream</span>
            <span className="text-[10px] text-stone-400 block">Primary Headings</span>
          </div>

          <div className="p-3 rounded-xl bg-[#20150F] border border-[#36271D] space-y-2">
            <div className="h-10 rounded-lg bg-[#FFC123] shadow-inner flex items-center justify-center font-mono text-[10px] text-black font-bold">
              #FFC123
            </div>
            <span className="text-xs font-bold text-sunset-amber block">Golden Amber</span>
            <span className="text-[10px] text-stone-400 block">Highlights & Stars</span>
          </div>

          <div className="p-3 rounded-xl bg-[#20150F] border border-[#36271D] space-y-2">
            <div className="h-10 rounded-lg bg-[#FF8F00] shadow-inner flex items-center justify-center font-mono text-[10px] text-white font-bold">
              #FF8F00
            </div>
            <span className="text-xs font-bold text-sunset-orange block">Tangerine Orange</span>
            <span className="text-[10px] text-stone-400 block">Primary Action Buttons</span>
          </div>

          <div className="p-3 rounded-xl bg-[#20150F] border border-[#36271D] space-y-2">
            <div className="h-10 rounded-lg bg-[#C4232B] shadow-inner flex items-center justify-center font-mono text-[10px] text-white font-bold">
              #C4232B
            </div>
            <span className="text-xs font-bold text-sunset-crimson block">Deep Crimson</span>
            <span className="text-[10px] text-stone-400 block">Critical Alerts & Rejects</span>
          </div>
        </div>
      </div>
    </div>
  );
}
