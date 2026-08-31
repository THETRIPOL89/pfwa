import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Lightweight UI store for ephemeral interaction state that needs to live
 * outside React's tree — sidebar collapse, command palette visibility,
 * currency preference.
 */

type UiState = {
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  preferredCurrency: 'EUR' | 'USD' | 'GBP';
  toggleSidebar: () => void;
  setCommandOpen: (open: boolean) => void;
  setCurrency: (c: 'EUR' | 'USD' | 'GBP') => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      commandOpen: false,
      preferredCurrency: 'EUR',
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      setCurrency: (preferredCurrency) => set({ preferredCurrency }),
    }),
    {
      name: 'pfwa:ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        preferredCurrency: state.preferredCurrency,
      }),
    },
  ),
);