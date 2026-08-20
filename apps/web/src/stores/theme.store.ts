'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppTheme = 'forest' | 'terracotta' | 'navy-mustard';

export interface ThemeConfig {
  id: AppTheme;
  name: string;
  description: string;
  badgeColor: string;
  primaryColor: string;
  bgPreview: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'forest',
    name: 'Forest & Cream',
    description: 'Clean Scandinavian editorial with deep emerald accents and oat canvas.',
    badgeColor: '#276749',
    primaryColor: '#276749',
    bgPreview: '#F5F3ED',
  },
  {
    id: 'terracotta',
    name: 'Terracotta & Sand',
    description: 'Warm organic linen aesthetic with terracotta rust and umber tones.',
    badgeColor: '#B85C38',
    primaryColor: '#B85C38',
    bgPreview: '#F1E7D8',
  },
  {
    id: 'navy-mustard',
    name: 'Navy + Mustard',
    description: 'Retro technical engineering dark canvas with mustard gold highlights.',
    badgeColor: '#D5A928',
    primaryColor: '#D5A928',
    bgPreview: '#101820',
  },
];

interface ThemeState {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'forest',
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
      },
    }),
    {
      name: 'interviewos-theme-preference',
    },
  ),
);
