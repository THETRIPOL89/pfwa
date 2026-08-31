import type { Account } from '@/types/domain';

/**
 * Marco's six accounts. Cached balances are seeded to be consistent with
 * the sum of opening balances + net of transactions in `transactions.ts`.
 */
export const MOCK_ACCOUNTS: Account[] = [
  {
    id: 'acc-checking',
    name: 'Conto Corrente',
    type: 'checking',
    currency: 'EUR',
    openingBalanceCents: 280000,
    color: 'cat-blue',
    icon: 'Wallet',
    institution: 'Intesa Sanpaolo',
    balanceCents: 345_028,
  },
  {
    id: 'acc-savings',
    name: 'Conto Risparmio',
    type: 'savings',
    currency: 'EUR',
    openingBalanceCents: 1_200_000,
    color: 'cat-emerald',
    icon: 'PiggyBank',
    institution: 'Intesa Sanpaolo',
    balanceCents: 1_280_432,
  },
  {
    id: 'acc-credit',
    name: 'Carta di Credito',
    type: 'credit_card',
    currency: 'EUR',
    openingBalanceCents: 0,
    color: 'cat-violet',
    icon: 'CreditCard',
    institution: 'Nexi',
    balanceCents: -41_870,
  },
  {
    id: 'acc-cash',
    name: 'Contanti',
    type: 'cash',
    currency: 'EUR',
    openingBalanceCents: 20_000,
    color: 'cat-amber',
    icon: 'Coins',
    balanceCents: 18_450,
  },
  {
    id: 'acc-crypto',
    name: 'Binance Crypto',
    type: 'crypto_wallet',
    currency: 'EUR',
    openingBalanceCents: 350_000,
    color: 'cat-amber',
    icon: 'Bitcoin',
    institution: 'Binance',
    balanceCents: 530_184,
  },
  {
    id: 'acc-invest',
    name: 'Conto Investimenti',
    type: 'investment',
    currency: 'EUR',
    openingBalanceCents: 1_500_000,
    color: 'cat-indigo',
    icon: 'TrendingUp',
    institution: 'Directa SIM',
    balanceCents: 1_870_256,
  },
];

/** Accounts that should appear in totals — excludes archived ones. */
export const ACTIVE_ACCOUNTS = MOCK_ACCOUNTS.filter((a) => !a.archived);