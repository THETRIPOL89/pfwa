import type { Transaction } from '@/types/domain';

/**
 * Generate 6 months of consistent mock transactions.
 * The deterministic generator ensures totals across pages add up and
 * creates a realistic "rising restaurants" trend that powers AI insights.
 *
 * Run at module load — fast (~250 rows) and frozen by date so re-renders
 * are stable.
 */

const TODAY = new Date();
TODAY.setHours(12, 0, 0, 0);

function dateNDaysAgo(n: number, hour = 12): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function dateInMonth(monthsAgo: number, day: number, hour = 9): string {
  const d = new Date(TODAY);
  d.setMonth(d.getMonth() - monthsAgo, day);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// Pseudo-random with seed so output is stable.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(42);

type TXInput = Omit<Transaction, 'id' | 'currency'>;

let counter = 0;
const nextId = () => `tx-${(++counter).toString().padStart(4, '0')}`;

const list: Transaction[] = [];

function tx(input: TXInput): Transaction {
  return { ...input, id: nextId(), currency: 'EUR' };
}

// ─── STIPENDIO ────────────────────────────────────────────
for (let m = 5; m >= 1; m--) {
  list.push(
    tx({
      accountId: 'acc-checking',
      categoryId: 'cat-stip',
      kind: 'income',
      amountCents: 280_000,
      occurredAt: dateInMonth(m, 27, 9),
      payee: 'Acme S.p.A.',
      notes: 'Stipendio mensile',
      tags: ['lavoro'],
    }),
  );
}

// ─── AFFITTO + BOLLETTE ───────────────────────────────────
for (let m = 5; m >= 0; m--) {
  list.push(
    tx({
      accountId: 'acc-checking',
      categoryId: 'cat-casa',
      kind: 'expense',
      amountCents: 95_000,
      occurredAt: dateInMonth(m, 3, 10),
      payee: 'Locatore',
      notes: 'Affitto Milano',
      tags: ['casa', 'fisso'],
    }),
  );
  list.push(
    tx({
      accountId: 'acc-checking',
      categoryId: 'cat-boll',
      kind: 'expense',
      amountCents: 6_200 + Math.round(rng() * 1_500),
      occurredAt: dateInMonth(m, 7, 11),
      payee: 'ENEL Energia',
      tags: ['bollette', 'fisso'],
    }),
  );
  list.push(
    tx({
      accountId: 'acc-checking',
      categoryId: 'cat-boll',
      kind: 'expense',
      amountCents: 4_800 + Math.round(rng() * 1_200),
      occurredAt: dateInMonth(m, 9, 11),
      payee: 'A2A Gas',
      tags: ['bollette', 'fisso'],
    }),
  );
  list.push(
    tx({
      accountId: 'acc-checking',
      categoryId: 'cat-boll',
      kind: 'expense',
      amountCents: 2_900,
      occurredAt: dateInMonth(m, 11, 11),
      payee: 'TIM Fibra',
      tags: ['internet', 'fisso'],
    }),
  );
  list.push(
    tx({
      accountId: 'acc-checking',
      categoryId: 'cat-boll',
      kind: 'expense',
      amountCents: 1_500,
      occurredAt: dateInMonth(m, 13, 11),
      payee: 'Vodafone Mobile',
      tags: ['telefono', 'fisso'],
    }),
  );
}

// ─── ABBONAMENTI (ricorrenti mensili) ─────────────────────
const SUBS = [
  { payee: 'Netflix', amount: 1_799 },
  { payee: 'Spotify', amount: 999 },
  { payee: 'Disney+', amount: 899 },
  { payee: 'Amazon Prime', amount: 499 },
  { payee: 'iCloud+', amount: 299 },
  { payee: 'NYTimes', amount: 450 },
];
for (let m = 5; m >= 0; m--) {
  SUBS.forEach((s, i) =>
    list.push(
      tx({
        accountId: 'acc-credit',
        categoryId: 'cat-abb',
        kind: 'expense',
        amountCents: s.amount,
        occurredAt: dateInMonth(m, 4 + i, 8),
        payee: s.payee,
        tags: ['abbonamento', 'ricorrente'],
        recurringRule: { freq: 'monthly', interval: 1 },
      }),
    ),
  );
}

// ─── SUPERMERCATO (2-3 volte a settimana) ────────────────
const SUPER = ['Esselunga', 'Conad', 'Carrefour', 'Lidl', 'Coop'];
for (let m = 5; m >= 0; m--) {
  for (let w = 0; w < 5; w++) {
    const day = 1 + w * 7 + Math.floor(rng() * 3);
    list.push(
      tx({
        accountId: rng() > 0.3 ? 'acc-checking' : 'acc-credit',
        categoryId: 'cat-alim',
        kind: 'expense',
        amountCents: 4_500 + Math.round(rng() * 6_500),
        occurredAt: dateInMonth(m, day, 18),
        payee: SUPER[Math.floor(rng() * SUPER.length)],
        tags: ['spesa'],
      }),
    );
  }
}

// ─── RISTORANTI (in crescita: insight) ───────────────────
// Il moltiplicatore cresce mese dopo mese — da 1.0 a 1.6.
for (let m = 5; m >= 0; m--) {
  const trend = 1 + (5 - m) * 0.12; // 1.0 → 1.6
  const count = 4 + Math.floor(rng() * 3);
  for (let i = 0; i < count; i++) {
    const day = 2 + i * 6 + Math.floor(rng() * 3);
    list.push(
      tx({
        accountId: 'acc-credit',
        categoryId: 'cat-rist',
        kind: 'expense',
        amountCents: Math.round((2_500 + rng() * 4_500) * trend),
        occurredAt: dateInMonth(m, day, 20),
        payee: ['Trattoria Da Luca', 'Pizzeria Sorrento', 'Hamburger King', 'Sushiko', 'Osteria del Borgo', 'Starbucks'][Math.floor(rng() * 6)],
        tags: ['ristorante'],
      }),
    );
  }
}

// ─── TRASPORTI / BENZINA ────────────────────────────────
for (let m = 5; m >= 0; m--) {
  list.push(
    tx({
      accountId: 'acc-credit',
      categoryId: 'cat-trasp',
      kind: 'expense',
      amountCents: 6_500 + Math.round(rng() * 3_000),
      occurredAt: dateInMonth(m, 12 + Math.floor(rng() * 3), 19),
      payee: 'ENI Station',
      tags: ['benzina'],
    }),
  );
  list.push(
    tx({
      accountId: 'acc-credit',
      categoryId: 'cat-trasp',
      kind: 'expense',
      amountCents: 1_350,
      occurredAt: dateInMonth(m, 5 + Math.floor(rng() * 25), 8),
      payee: 'ATM Milano',
      tags: ['trasporti', 'biglietto'],
    }),
  );
  if (m % 2 === 0) {
    list.push(
      tx({
        accountId: 'acc-credit',
        categoryId: 'cat-trasp',
        kind: 'expense',
        amountCents: 4_500 + Math.round(rng() * 2_500),
        occurredAt: dateInMonth(m, 17 + Math.floor(rng() * 4), 18),
        payee: 'Trenitalia',
        tags: ['treno'],
      }),
    );
  }
}

// ─── SVAGO ───────────────────────────────────────────────
for (let m = 5; m >= 0; m--) {
  list.push(
    tx({
      accountId: 'acc-credit',
      categoryId: 'cat-svago',
      kind: 'expense',
      amountCents: 1_499,
      occurredAt: dateInMonth(m, 14, 21),
      payee: 'Steam',
      tags: ['videogiochi'],
    }),
  );
  if (rng() > 0.4) {
    list.push(
      tx({
        accountId: 'acc-credit',
        categoryId: 'cat-svago',
        kind: 'expense',
        amountCents: 1_200 + Math.round(rng() * 1_500),
        occurredAt: dateInMonth(m, 19 + Math.floor(rng() * 4), 21),
        payee: 'Cinema TheSpace',
        tags: ['cinema'],
      }),
    );
  }
  if (m === 2) {
    list.push(
      tx({
        accountId: 'acc-credit',
        categoryId: 'cat-viaggi',
        kind: 'expense',
        amountCents: 89_000,
        occurredAt: dateInMonth(m, 21, 10),
        payee: 'Booking.com',
        notes: 'Weekend Roma',
        tags: ['viaggio'],
      }),
    );
  }
}

// ─── SALUTE ──────────────────────────────────────────────
list.push(
  tx({
    accountId: 'acc-checking',
    categoryId: 'cat-salute',
    kind: 'expense',
    amountCents: 6_500,
    occurredAt: dateNDaysAgo(45),
    payee: 'Farmacia Centrale',
  }),
  tx({
    accountId: 'acc-checking',
    categoryId: 'cat-salute',
    kind: 'expense',
    amountCents: 12_000,
    occurredAt: dateNDaysAgo(82),
    payee: 'Studio Dentistico Bianchi',
    notes: 'Pulizia annuale',
  }),
);

// ─── CRYPTO ──────────────────────────────────────────────
list.push(
  tx({
    accountId: 'acc-crypto',
    categoryId: 'cat-crypto',
    kind: 'expense',
    amountCents: 50_000,
    occurredAt: dateNDaysAgo(120),
    payee: 'Binance',
    notes: 'Acquisto BTC',
    tags: ['crypto', 'investimento'],
  }),
  tx({
    accountId: 'acc-crypto',
    categoryId: 'cat-crypto',
    kind: 'expense',
    amountCents: 25_000,
    occurredAt: dateNDaysAgo(60),
    payee: 'Binance',
    notes: 'Acquisto ETH',
    tags: ['crypto'],
  }),
);

// ─── RISPARMIO TRASFERIMENTO ─────────────────────────────
for (let m = 5; m >= 0; m--) {
  list.push(
    tx({
      accountId: 'acc-checking',
      categoryId: 'cat-banca',
      kind: 'expense',
      amountCents: 30_000,
      occurredAt: dateInMonth(m, 28, 9),
      payee: 'Bonifico Risparmio',
      notes: 'Accantonamento mensile',
      tags: ['risparmio', 'ricorrente'],
      transferId: `trf-${m}`,
    }),
    tx({
      accountId: 'acc-savings',
      categoryId: 'cat-rist', // neutral category on receiving side
      kind: 'income',
      amountCents: 30_000,
      occurredAt: dateInMonth(m, 28, 9),
      payee: 'Trasferimento interno',
      transferId: `trf-${m}`,
    }),
  );
}

// ─── RECENTI (ultimi 30 giorni, per "ultime transazioni") ──
// Aggiungo qualche movimento random recente per popolare la home.
for (let i = 0; i < 18; i++) {
  const payees = [
    { p: 'Amazon', c: 'cat-shop', a: 1500 + Math.round(rng() * 12_000) },
    { p: 'Zalando', c: 'cat-shop', a: 3_500 + Math.round(rng() * 6_000) },
    { p: 'Decathlon', c: 'cat-svago', a: 2_500 + Math.round(rng() * 7_000) },
    { p: 'IKEA', c: 'cat-casa', a: 4_000 + Math.round(rng() * 18_000) },
    { p: 'Eataly', c: 'cat-alim', a: 3_000 + Math.round(rng() * 6_000) },
    { p: 'Medico di base', c: 'cat-salute', a: 5_000 + Math.round(rng() * 8_000) },
  ];
  const pick = payees[Math.floor(rng() * payees.length)];
  const days = 1 + Math.floor(rng() * 25);
  list.push(
    tx({
      accountId: rng() > 0.5 ? 'acc-credit' : 'acc-checking',
      categoryId: pick.c,
      kind: 'expense',
      amountCents: pick.a,
      occurredAt: dateNDaysAgo(days, 10 + Math.floor(rng() * 10)),
      payee: pick.p,
    }),
  );
}

// ─── DIVIDENDI ───────────────────────────────────────────
list.push(
  tx({
    accountId: 'acc-invest',
    categoryId: 'cat-divid',
    kind: 'income',
    amountCents: 4_280,
    occurredAt: dateNDaysAgo(70),
    payee: 'VWRL.MI',
    notes: 'Dividendo Q1',
    tags: ['dividendo', 'ETF'],
  }),
  tx({
    accountId: 'acc-invest',
    categoryId: 'cat-divid',
    kind: 'income',
    amountCents: 1_870,
    occurredAt: dateNDaysAgo(35),
    payee: 'ENI.MI',
    notes: 'Dividendo azionario',
    tags: ['dividendo'],
  }),
  tx({
    accountId: 'acc-invest',
    categoryId: 'cat-divid',
    kind: 'income',
    amountCents: 3_200,
    occurredAt: dateNDaysAgo(15),
    payee: 'AAPL',
    notes: 'Dividendo trimestrale',
    tags: ['dividendo'],
  }),
);

// Ordina per data decrescente.
list.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));

export const MOCK_TRANSACTIONS: Transaction[] = list;