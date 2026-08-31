import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  setSession: (s: Session | null) => void;
  setLoading: (l: boolean) => void;
};

/**
 * Lightweight mirror of the Supabase session for the UI. The source of
 * truth is the supabase-js client (which persists the token in
 * localStorage); this store just exposes the bits the React tree needs
 * and re-renders on auth changes.
 */
export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setLoading: (loading) => set({ loading }),
}));

/** Wire up the auth listener. Call once from the top of the React tree. */
export function initAuthListener() {
  // 1. Hydrate from any persisted session.
  supabase.auth.getSession().then(({ data }) => {
    useAuthStore.getState().setSession(data.session);
    useAuthStore.getState().setLoading(false);
  });

  // 2. Listen for changes (sign-in, sign-out, token refresh).
  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setSession(session);
    useAuthStore.getState().setLoading(false);
  });
}