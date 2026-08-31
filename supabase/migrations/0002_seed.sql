-- =============================================================================
-- Seed default Italian categories. Safe to re-run.
-- These rows have user_id = NULL → visible to every user via the RLS policy
-- `categories_read` above.
-- =============================================================================

insert into public.categories (user_id, name, icon, color, kind, is_default) values
  (null, 'Alimentari',    'ShoppingCart',    'cat-emerald', 'expense', true),
  (null, 'Ristoranti',    'UtensilsCrossed', 'cat-orange',  'expense', true),
  (null, 'Trasporti',     'Bus',             'cat-sky',     'expense', true),
  (null, 'Bollette',      'ReceiptText',     'cat-amber',   'expense', true),
  (null, 'Abbonamenti',   'Repeat',          'cat-violet',  'expense', true),
  (null, 'Svago',         'Gamepad2',        'cat-fuchsia', 'expense', true),
  (null, 'Salute',        'HeartPulse',      'cat-rose',    'expense', true),
  (null, 'Casa',          'Home',            'cat-blue',    'expense', true),
  (null, 'Shopping',      'ShoppingBag',     'cat-pink',    'expense', true),
  (null, 'Viaggi',        'Plane',           'cat-cyan',    'expense', true),
  (null, 'Istruzione',    'GraduationCap',   'cat-indigo',  'expense', true),
  (null, 'Regali',        'Gift',            'cat-rose',    'expense', true),
  (null, 'Tasse',         'Landmark',        'cat-slate',   'expense', true),
  (null, 'Banca',         'Banknote',        'cat-slate',   'expense', true),
  (null, 'Crypto',        'Bitcoin',         'cat-amber',   'expense', true),
  (null, 'Stipendio',     'Briefcase',       'cat-teal',    'income',  true),
  (null, 'Freelance',     'Laptop',          'cat-emerald', 'income',  true),
  (null, 'Dividendi',     'Coins',           'cat-amber',   'income',  true),
  (null, 'Regali ricevuti','Gift',           'cat-fuchsia', 'income',  true),
  (null, 'Rimborsi',      'PiggyBank',       'cat-sky',     'income',  true)
on conflict do nothing;