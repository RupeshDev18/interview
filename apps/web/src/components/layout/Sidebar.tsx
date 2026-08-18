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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/use-auth';
import { UserRole } from '@intvwplt/shared';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/candidates',
    label: 'Candidates',
    icon: Users,
    roles: [UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.RECRUITER],
  },
  {
    href: '/interviews',
    label: 'Interviews',
    icon: Calendar,
  },
  {
    href: '/interviewers',
    label: 'Interviewers',
    icon: UserCheck,
    roles: [UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.RECRUITER],
  },
  {
    href: '/availability',
    label: 'Availability',
    icon: Clock,
    roles: [UserRole.INTERVIEWER],
  },
  {
    href: '/questions',
    label: 'Question Bank',
    icon: BookOpen,
  },
  {
    href: '/admin/analytics',
    label: 'Analytics',
    icon: BarChart3,
    roles: [UserRole.ADMIN, UserRole.COMPANY_ADMIN],
  },
  {
    href: '/admin/companies',
    label: 'Companies',
    icon: Building2,
    roles: [UserRole.ADMIN],
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: Shield,
    roles: [UserRole.ADMIN],
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useCurrentUser();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role as UserRole)),
  );

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-slate-900 border-r border-slate-800 py-4">
      {/* Logo */}
      <div className="px-4 mb-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">IP</span>
          </div>
          <span className="font-semibold text-white text-sm">InterviewPlatform</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50',
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      {user && (
        <div className="px-4 pt-4 border-t border-slate-800 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-medium text-xs">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-slate-500 text-xs truncate capitalize">
                {user.role.toLowerCase().replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
