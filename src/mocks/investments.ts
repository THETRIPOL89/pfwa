import type { Investment, Dividend } from '@/types/domain';

export const MOCK_INVESTMENTS: Investment[] = [
  {
    id: 'inv-vwrl',
    accountId: 'acc-invest',
    symbol: 'VWRL.MI',
    name: 'Vanguard FTSE All-World UCITS ETF',
    assetClass: 'etf',
    quantity: 45,
    avgCostCents: 9_840_00, // €98.40 per share, expressed in cents × 100
    currency: 'EUR',
  },
  {
    id: 'inv-aapl',
    accountId: 'acc-invest',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    assetClass: 'stock',
    quantity: 12,
    avgCostCents: 14_220_00,
    currency: 'USD',
  },
  {
    id: 'inv-eni',
    accountId: 'acc-invest',
    symbol: 'ENI.MI',
    name: 'Eni S.p.A.',
    assetClass: 'stock',
    quantity: 80,
    avgCostCents: 1_320_00,
    currency: 'EUR',
  },
  {
    id: 'inv-tit',
    accountId: 'acc-invest',
    symbol: 'TIT',
    name: 'BTP 10Y Italian Government Bond',
    assetClass: 'bond',
    quantity: 50,
    avgCostCents: 10_000_00,
    currency: 'EUR',
  },
  {
    id: 'inv-btc',
    accountId: 'acc-crypto',
    symbol: 'BTC',
    name: 'Bitcoin',
    assetClass: 'crypto',
    quantity: 0.0872,
    avgCostCents: 5_730_000_00,
    currency: 'EUR',
  },
  {
    id: 'inv-eth',
    accountId: 'acc-crypto',
    symbol: 'ETH',
    name: 'Ethereum',
    assetClass: 'crypto',
    quantity: 1.4,
    avgCostCents: 287_000_00,
    currency: 'EUR',
  },
];

export const MOCK_DIVIDENDS: Dividend[] = [
  { id: 'div-1', investmentId: 'inv-vwrl', amountCents: 4_280, currency: 'EUR', receivedAt: '2026-05-20' },
  { id: 'div-2', investmentId: 'inv-eni', amountCents: 1_870, currency: 'EUR', receivedAt: '2026-07-15' },
  { id: 'div-3', investmentId: 'inv-aapl', amountCents: 3_200, currency: 'USD', receivedAt: '2026-08-15' },
];