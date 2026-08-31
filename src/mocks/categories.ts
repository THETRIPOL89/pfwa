import type { Category } from '@/types/domain';

/**
 * Default italian category tree seeded for every new user. IDs are stable
 * across reloads so analytics and budget alerts keep working when mock
 * data is swapped for Supabase.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  // ─── Spese ──────────────────────────────────────────────
  { id: 'cat-alim', name: 'Alimentari', icon: 'ShoppingCart', color: 'cat-emerald', kind: 'expense', isDefault: true },
  { id: 'cat-rist', name: 'Ristoranti', icon: 'UtensilsCrossed', color: 'cat-orange', kind: 'expense', isDefault: true },
  { id: 'cat-trasp', name: 'Trasporti', icon: 'Bus', color: 'cat-sky', kind: 'expense', isDefault: true },
  { id: 'cat-boll', name: 'Bollette', icon: 'ReceiptText', color: 'cat-amber', kind: 'expense', isDefault: true },
  { id: 'cat-abb', name: 'Abbonamenti', icon: 'Repeat', color: 'cat-violet', kind: 'expense', isDefault: true },
  { id: 'cat-svago', name: 'Svago', icon: 'Gamepad2', color: 'cat-fuchsia', kind: 'expense', isDefault: true },
  { id: 'cat-salute', name: 'Salute', icon: 'HeartPulse', color: 'cat-rose', kind: 'expense', isDefault: true },
  { id: 'cat-casa', name: 'Casa', icon: 'Home', color: 'cat-blue', kind: 'expense', isDefault: true },
  { id: 'cat-shop', name: 'Shopping', icon: 'ShoppingBag', color: 'cat-pink', kind: 'expense', isDefault: true },
  { id: 'cat-viaggi', name: 'Viaggi', icon: 'Plane', color: 'cat-cyan', kind: 'expense', isDefault: true },
  { id: 'cat-istruzione', name: 'Istruzione', icon: 'GraduationCap', color: 'cat-indigo', kind: 'expense', isDefault: true },
  { id: 'cat-regali', name: 'Regali', icon: 'Gift', color: 'cat-rose', kind: 'expense', isDefault: true },
  { id: 'cat-tasse', name: 'Tasse', icon: 'Landmark', color: 'cat-slate', kind: 'expense', isDefault: true },
  { id: 'cat-banca', name: 'Banca', icon: 'Banknote', color: 'cat-slate', kind: 'expense', isDefault: true },
  { id: 'cat-crypto', name: 'Crypto', icon: 'Bitcoin', color: 'cat-amber', kind: 'expense', isDefault: true },
  // ─── Entrate ────────────────────────────────────────────
  { id: 'cat-stip', name: 'Stipendio', icon: 'Briefcase', color: 'cat-teal', kind: 'income', isDefault: true },
  { id: 'cat-freel', name: 'Freelance', icon: 'Laptop', color: 'cat-emerald', kind: 'income', isDefault: true },
  { id: 'cat-divid', name: 'Dividendi', icon: 'Coins', color: 'cat-amber', kind: 'income', isDefault: true },
  { id: 'cat-regali-in', name: 'Regali ricevuti', icon: 'Gift', color: 'cat-fuchsia', kind: 'income', isDefault: true },
  { id: 'cat-rimb', name: 'Rimborsi', icon: 'PiggyBank', color: 'cat-sky', kind: 'income', isDefault: true },
];