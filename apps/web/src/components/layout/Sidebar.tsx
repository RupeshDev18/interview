'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserCheck,
  Clock,
  BookOpen,
  Settings,
  Shield,
  BarChart3,
  Building2,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/use-auth';
import { useThemeStore } from '@/stores/theme.store';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const { theme } = useThemeStore();

  const role = user?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isCompanyAdmin = role === 'COMPANY_ADMIN';
  const isRecruiter = role === 'RECRUITER';
  const isInterviewer = role === 'INTERVIEWER';

  // Main navigation items
  const mainNavItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  if (isAdmin || isCompanyAdmin || isRecruiter) {
    mainNavItems.push({ href: '/candidates', label: 'Candidates', icon: Users });
  }

  mainNavItems.push({ href: '/interviews', label: 'Interviews', icon: Calendar });

  if (isAdmin || isCompanyAdmin || isRecruiter) {
    mainNavItems.push({ href: '/interviewers', label: 'Interviewers', icon: UserCheck });
  }

  if (isInterviewer) {
    mainNavItems.push({ href: '/availability', label: 'Availability', icon: Clock });
  }

  mainNavItems.push({ href: '/questions', label: 'Question Bank', icon: BookOpen });

  // Admin Section items
  const adminNavItems: NavItem[] = [];
  if (isAdmin || isCompanyAdmin) {
    adminNavItems.push({
      href: '/admin/analytics',
      label: 'Analytics',
      icon: BarChart3,
    });
  }
  if (isAdmin) {
    adminNavItems.push({
      href: '/admin/companies',
      label: 'Companies',
      icon: Building2,
    });
    adminNavItems.push({
      href: '/admin/users',
      label: 'User Accounts',
      icon: Shield,
    });
  }

  const renderNavGroup = (items: NavItem[]) => (
    <div className="space-y-1">
      {items.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
              isActive
                ? 'bg-theme-accent/20 text-white font-semibold border-l-2 border-theme-accent shadow-inner'
                : 'text-stone-300/80 hover:text-white hover:bg-white/5',
            )}
          >
            <item.icon
              className={cn(
                'h-4 w-4 flex-shrink-0',
                isActive ? 'text-theme-accent brightness-125' : 'text-stone-400',
              )}
            />
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-auto text-xs bg-theme-accent text-white px-1.5 py-0.5 rounded-full font-bold">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-sidebar border-r border-theme py-4 select-none text-white">
      {/* Logo */}
      <div className="px-4 mb-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-theme-accent flex items-center justify-center flex-shrink-0 shadow-md shadow-black/30">
            <span className="text-white font-bold text-sm">IP</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-sm group-hover:opacity-90 transition-opacity">
              InterviewOS
            </span>
            <span className="text-[10px] text-stone-400 font-mono -mt-0.5 capitalize">
              {theme.replace('-', ' ')}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-2 space-y-6 overflow-y-auto">
        {/* Main Section */}
        <div>
          <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
            Navigation
          </p>
          {renderNavGroup(mainNavItems)}
        </div>

        {/* Administration Section */}
        {adminNavItems.length > 0 && (
          <div>
            <div className="px-3 mb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-accent font-mono flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" /> Administration
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-theme-accent/20 text-white font-mono font-bold">
                ADMIN
              </span>
            </div>
            {renderNavGroup(adminNavItems)}
          </div>
        )}

        {/* Settings */}
        <div>
          <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
            System
          </p>
          {renderNavGroup([
            { href: '/settings', label: 'Settings', icon: Settings },
          ])}
        </div>
      </nav>

      {/* User profile footer */}
      {user && (
        <div className="px-4 pt-4 border-t border-white/10 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-theme-accent/20 border border-theme-accent/40 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-xs">
                {user.firstName[0]}
                {user.lastName[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-stone-400 text-[11px] truncate capitalize font-mono">
                {user.role.toLowerCase().replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
