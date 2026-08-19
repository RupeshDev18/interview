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
    <header className="h-14 border-b border-[#36271D] bg-[#150E0A]/90 backdrop-blur-md sticky top-0 z-30 flex items-center px-6 justify-between select-none">
      {title && (
        <h1 className="font-bold text-sunset-cream text-base tracking-tight flex items-center gap-2">
          {title}
        </h1>
      )}

      <div className="flex items-center gap-3 ml-auto">
        {/* Admin Quick Switcher Dropdown */}
        {hasAdminAccess && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5 border-sunset-orange/30 bg-sunset-orange/10 text-sunset-amber hover:bg-sunset-orange/20 hover:text-sunset-cream"
              >
                <Shield className="h-3.5 w-3.5 text-sunset-orange" />
                <span>Admin Panel</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#18110C] border-[#36271D] text-sunset-cream">
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-sunset-amber/80 font-mono">
                Management Console
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#36271D]" />
              <DropdownMenuItem asChild>
                <Link href="/admin/analytics" className="cursor-pointer flex items-center gap-2 hover:bg-[#251A13]">
                  <BarChart3 className="h-4 w-4 text-sunset-orange" />
                  <span>Platform Analytics</span>
                </Link>
              </DropdownMenuItem>

              {isAdmin && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/companies" className="cursor-pointer flex items-center gap-2 hover:bg-[#251A13]">
                      <Building2 className="h-4 w-4 text-sunset-amber" />
                      <span>Organizations & Tenancy</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/users" className="cursor-pointer flex items-center gap-2 hover:bg-[#251A13]">
                      <Shield className="h-4 w-4 text-sunset-crimson" />
                      <span>User Accounts & Roles</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Live System Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#231711] border border-[#3D2D22] text-[11px] font-mono text-sunset-amber">
          <span className="w-2 h-2 rounded-full bg-sunset-orange animate-pulse" />
          <span>Live Interview OS</span>
        </div>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-stone-400 hover:text-sunset-cream hover:bg-[#231711]"
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
                className="gap-2 px-2 hover:bg-[#231711] text-sunset-cream"
              >
                <div className="w-7 h-7 rounded-full bg-sunset-orange/20 border border-sunset-orange/30 flex items-center justify-center">
                  <span className="text-xs font-semibold text-sunset-amber">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </span>
                </div>
                <span className="text-sm font-medium hidden sm:block text-sunset-cream">
                  {user.firstName} {user.lastName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-[#18110C] border-[#36271D] text-sunset-cream"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                  <span className="text-[10px] font-mono text-sunset-amber">
                    Role: {user.role}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#36271D]" />

              {hasAdminAccess && (
                <>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/admin/analytics"
                      className="cursor-pointer flex items-center gap-2 hover:bg-[#251A13]"
                    >
                      <BarChart3 className="h-4 w-4 text-sunset-orange" />
                      <span>Executive Analytics</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/companies"
                        className="cursor-pointer flex items-center gap-2 hover:bg-[#251A13]"
                      >
                        <Building2 className="h-4 w-4 text-sunset-amber" />
                        <span>Company Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-[#36271D]" />
                </>
              )}

              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className="cursor-pointer flex items-center gap-2 hover:bg-[#251A13]"
                >
                  <User className="h-4 w-4 mr-1 text-stone-400" />
                  <span>Profile & Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-[#36271D]" />

              <DropdownMenuItem
                className="text-rose-400 cursor-pointer flex items-center gap-2 hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-400"
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
