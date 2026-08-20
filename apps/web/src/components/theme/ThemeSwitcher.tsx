'use client';

import React from 'react';
import { Palette, Check } from 'lucide-react';
import { useThemeStore, THEMES, type AppTheme } from '@/stores/theme.store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();
  const currentTheme = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 text-xs font-semibold border-theme bg-surface text-theme-primary hover:bg-surface-subtle"
        >
          <span
            className="w-3 h-3 rounded-full border border-black/20 shrink-0"
            style={{ backgroundColor: currentTheme.primaryColor }}
          />
          <span className="hidden md:inline">{currentTheme.name}</span>
          <Palette className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-card border-theme text-theme-primary p-2 space-y-1">
        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-theme-muted font-mono px-2">
          Select Visual Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-theme-border" />
        {THEMES.map((t) => {
          const isSelected = t.id === theme;
          return (
            <DropdownMenuItem
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`cursor-pointer rounded-lg p-2.5 flex items-start gap-3 transition-colors ${
                isSelected
                  ? 'bg-surface-subtle border border-theme font-semibold'
                  : 'hover:bg-surface-subtle'
              }`}
            >
              <div
                className="w-6 h-6 rounded-md border border-theme shadow-sm flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: t.bgPreview }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: t.primaryColor }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-theme-primary">{t.name}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-theme-accent" />}
                </div>
                <p className="text-[10px] text-theme-muted leading-tight mt-0.5 line-clamp-2">
                  {t.description}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
