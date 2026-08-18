'use client';

import { Bell, LogOut, User, ChevronDown } from 'lucide-react';
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

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-30 flex items-center px-6 justify-between">
      {title && (
        <h1 className="font-semibold text-foreground">{title}</h1>
      )}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications — Phase 9 */}
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        {/* User menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                </div>
                <span className="text-sm hidden sm:block">
                  {user.firstName} {user.lastName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  Profile & Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive cursor-pointer"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {logout.isPending ? 'Signing out…' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
