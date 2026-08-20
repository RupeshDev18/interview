'use client';

import {
  Bell,
  LogOut,
  User,
  ChevronDown,
  Shield,
  Building2,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { useCurrentUser, useLogout } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const user = useCurrentUser();
  const logout = useLogout();

  const role = user?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isCompanyAdmin = role === 'COMPANY_ADMIN';
  const hasAdminAccess = isAdmin || isCompanyAdmin;

  return (
    <header className="h-14 border-b border-theme bg-surface/95 backdrop-blur-md sticky top-0 z-30 flex items-center px-6 justify-between select-none">
      {title && (
        <h1 className="font-bold text-theme-primary text-base tracking-tight flex items-center gap-2">
          {title}
        </h1>
      )}

      <div className="flex items-center gap-3 ml-auto">
        {/* Visual Palette Switcher */}
        <ThemeSwitcher />

        {/* Admin Quick Switcher Dropdown */}
        {hasAdminAccess && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5 border-theme bg-surface-subtle text-theme-accent hover:bg-surface"
              >
                <Shield className="h-3.5 w-3.5 text-theme-accent" />
                <span>Admin Panel</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-theme text-theme-primary">
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-theme-muted font-mono">
                Management Console
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-theme-border" />
              <DropdownMenuItem asChild>
                <Link href="/admin/analytics" className="cursor-pointer flex items-center gap-2 hover:bg-surface-subtle">
                  <BarChart3 className="h-4 w-4 text-theme-accent" />
                  <span>Platform Analytics</span>
                </Link>
              </DropdownMenuItem>

              {isAdmin && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/companies" className="cursor-pointer flex items-center gap-2 hover:bg-surface-subtle">
                      <Building2 className="h-4 w-4 text-theme-accent" />
                      <span>Organizations & Tenancy</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/users" className="cursor-pointer flex items-center gap-2 hover:bg-surface-subtle">
                      <Shield className="h-4 w-4 text-theme-accent" />
                      <span>User Accounts & Roles</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Live System Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-subtle border border-theme text-[11px] font-mono text-theme-muted">
          <span className="w-2 h-2 rounded-full bg-theme-accent animate-pulse" />
          <span>Live Interview OS</span>
        </div>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-theme-muted hover:text-theme-primary hover:bg-surface-subtle"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>

        {/* User menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 px-2 hover:bg-surface-subtle text-theme-primary"
              >
                <div className="w-7 h-7 rounded-full bg-theme-accent/20 border border-theme-accent/30 flex items-center justify-center">
                  <span className="text-xs font-semibold text-theme-accent">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </span>
                </div>
                <span className="text-sm font-medium hidden sm:block text-theme-primary">
                  {user.firstName} {user.lastName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-theme-muted" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-card border-theme text-theme-primary"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-theme-primary">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-theme-muted truncate">
                    {user.email}
                  </p>
                  <span className="text-[10px] font-mono text-theme-accent">
                    Role: {user.role}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-theme-border" />

              {hasAdminAccess && (
                <>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/admin/analytics"
                      className="cursor-pointer flex items-center gap-2 hover:bg-surface-subtle"
                    >
                      <BarChart3 className="h-4 w-4 text-theme-accent" />
                      <span>Executive Analytics</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/companies"
                        className="cursor-pointer flex items-center gap-2 hover:bg-surface-subtle"
                      >
                        <Building2 className="h-4 w-4 text-theme-accent" />
                        <span>Company Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-theme-border" />
                </>
              )}

              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className="cursor-pointer flex items-center gap-2 hover:bg-surface-subtle"
                >
                  <User className="h-4 w-4 mr-1 text-theme-muted" />
                  <span>Profile & Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-theme-border" />

              <DropdownMenuItem
                className="text-rose-600 dark:text-rose-400 cursor-pointer flex items-center gap-2 hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-600"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span>{logout.isPending ? 'Signing out…' : 'Sign out'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
