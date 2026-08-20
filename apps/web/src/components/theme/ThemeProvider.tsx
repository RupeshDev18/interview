'use client';

import React, { useEffect, useState } from 'react';
import { useThemeStore } from '@/stores/theme.store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Set initial attribute on render
  useEffect(() => {
    const savedTheme = localStorage.getItem('interviewos-theme-preference');
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        if (parsed?.state?.theme) {
          document.documentElement.setAttribute('data-theme', parsed.state.theme);
        }
      } catch {}
    } else {
      document.documentElement.setAttribute('data-theme', 'forest');
    }
  }, []);

  return <>{children}</>;
}
