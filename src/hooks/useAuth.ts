import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase';

/** Lightweight auth hook. Throws if used outside a signed-in context. */
export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  return { session, user, loading, isAuthenticated: !!session };
}

/** Sign in with email + password. */
export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Create a new account and sign the user in. */
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

/** Send a magic link to the given email. */
export async function sendMagicLink(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Use the production origin by default; works in dev too.
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) throw error;
  return data;
}

/** Sign the current user out. */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Update the current user's password (requires recent session). */
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}