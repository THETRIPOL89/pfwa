import type { Budget } from '@/types/domain';

/**
 * Monthly budgets for the current month. Categories with spending over
 * 100% will trigger an alert badge on the dashboard.
 */
export const MOCK_BUDGETS: Budget[] = [
  { id: 'bud-alim', categoryId: 'cat-alim', period: 'monthly', amountCents: 40_000, startsOn: '2026-08-01' },
  { id: 'bud-rist', categoryId: 'cat-rist', period: 'monthly', amountCents: 15_000, startsOn: '2026-08-01' },
  { id: 'bud-trasp', categoryId: 'cat-trasp', period: 'monthly', amountCents: 12_000, startsOn: '2026-08-01' },
  { id: 'bud-svago', categoryId: 'cat-svago', period: 'monthly', amountCents: 10_000, startsOn: '2026-08-01' },
  { id: 'bud-boll', categoryId: 'cat-boll', period: 'monthly', amountCents: 20_000, startsOn: '2026-08-01' },
  { id: 'bud-shop', categoryId: 'cat-shop', period: 'monthly', amountCents: 8_000, startsOn: '2026-08-01' },
];