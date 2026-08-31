import { create } from 'zustand';

type SyncState = {
  online: boolean;
  pendingMutations: number;
  lastSyncedAt: number | null;
  setOnline: (online: boolean) => void;
  setPending: (count: number) => void;
  setLastSyncedAt: (ts: number) => void;
};

/**
 * Online/offline status of the browser and pending mutation count surfaced
 * in the top bar. The mutation queue is in IndexedDB; this store just
 * exposes a counter for the UI badge.
 */
export const useSyncStore = create<SyncState>((set) => ({
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  pendingMutations: 0,
  lastSyncedAt: null,
  setOnline: (online) => set({ online }),
  setPending: (pendingMutations) => set({ pendingMutations }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
}));