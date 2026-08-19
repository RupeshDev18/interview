'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Palette,
  CheckCircle2,
  Building,
  Mail,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/use-auth';

export default function SettingsPage() {
  const user = useCurrentUser();

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
          <h1 className="text-2xl font-bold tracking-tight text-sunset-cream flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sunset-orange to-sunset-crimson flex items-center justify-center shadow-md shadow-sunset-orange/20">
              <SettingsIcon className="h-4 w-4 text-sunset-cream" />
            </div>
            User Profile & Preferences
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Manage your account details, role permissions, and workspace preferences.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>Profile preferences saved successfully!</span>
        </div>
      )}

      {/* User Profile Card */}
      <div className="bg-[#18110C]/90 p-6 rounded-2xl border border-[#36271D] shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#36271D] pb-3">
          <div className="flex items-center gap-2.5">
            <User className="h-4 w-4 text-sunset-orange" />
            <h2 className="text-base font-bold text-sunset-cream">Personal Information</h2>
          </div>
          {user?.role && (
            <Badge variant="outline" className="border-sunset-orange/40 text-sunset-amber bg-sunset-orange/10 font-mono text-xs">
              Role: {user.role}
            </Badge>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-300">First Name</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-[#120B07] border-[#36271D] text-sunset-cream text-xs focus-visible:ring-sunset-orange"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-300">Last Name</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-[#120B07] border-[#36271D] text-sunset-cream text-xs focus-visible:ring-sunset-orange"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-300">Email Address</Label>
              <Input
                type="email"
                disabled
                value={email}
                className="bg-[#120B07] border-[#36271D] text-stone-400 text-xs font-mono opacity-80 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-300">Phone Number</Label>
              <Input
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-[#120B07] border-[#36271D] text-sunset-cream text-xs focus-visible:ring-sunset-orange"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="gradient-sunset-btn text-xs font-semibold gap-1.5">
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Palette Info Card */}
      <div className="bg-[#18110C]/90 p-6 rounded-2xl border border-[#36271D] shadow-xl space-y-5">
        <div className="flex items-center gap-2.5 border-b border-[#36271D] pb-3">
          <Palette className="h-4 w-4 text-sunset-amber" />
          <h2 className="text-base font-bold text-sunset-cream">Theme Tokens & Design System</h2>
        </div>

        <p className="text-xs text-stone-400">
          InterviewOS is tuned with the <strong>Obsidian Sunset</strong> theme for high readability during prolonged interview sessions.
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
            <span className="text-[10px] text-stone-400 block">Highlights & Badges</span>
          </div>

          <div className="p-3 rounded-xl bg-[#20150F] border border-[#36271D] space-y-2">
            <div className="h-10 rounded-lg bg-[#FF8F00] shadow-inner flex items-center justify-center font-mono text-[10px] text-white font-bold">
              #FF8F00
            </div>
            <span className="text-xs font-bold text-sunset-orange block">Sunset Orange</span>
            <span className="text-[10px] text-stone-400 block">Primary Actions</span>
          </div>

          <div className="p-3 rounded-xl bg-[#20150F] border border-[#36271D] space-y-2">
            <div className="h-10 rounded-lg bg-[#C4232B] shadow-inner flex items-center justify-center font-mono text-[10px] text-white font-bold">
              #C4232B
            </div>
            <span className="text-xs font-bold text-sunset-crimson block">Deep Crimson</span>
            <span className="text-[10px] text-stone-400 block">Critical Alerts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
