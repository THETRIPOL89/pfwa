import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolved: 'light' | 'dark';
  setResolved: (r: 'light' | 'dark') => void;
};

/**
 * Theme persistence. Reads/writes to localStorage under `pfwa:theme`.
 * The actual <html class="dark"> toggle is driven by a hook in App.tsx
 * so this store stays pure.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      resolved: 'light',
      setMode: (mode) => set({ mode }),
      setResolved: (resolved) => set({ resolved }),
    }),
    { name: 'pfwa:theme' },
  ),
);