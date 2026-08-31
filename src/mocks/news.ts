import type { NewsArticle } from '@/types/domain';

/**
 * Mock financial news for the dashboard widget. The same shape is
 * returned by the `news-feed` Edge Function when fetching Google News RSS.
 */
export const MOCK_NEWS: NewsArticle[] = [
  {
    id: 'n-1',
    title: 'BCE: tassi stabili nel terzo trimestre, inflazione in calo al 2,1%',
    source: 'Il Sole 24 Ore',
    url: 'https://example.com/bce-tassi-stabili',
    publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    summary:
      'La Banca Centrale Europea conferma la pausa del ciclo di tagli e guarda con ottimismo al rientro dell\'inflazione.',
    category: 'mercati',
  },
  {
    id: 'n-2',
    title: 'Piazza Affari chiude in rialzo, Ftse Mib +1,2% trainato da STM e Intesa',
    source: 'Reuters Italia',
    url: 'https://example.com/ftse-mib-rialzo',
    publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    summary:
      'Le banche guidano il rimbalzo dopo i dati macro positivi. Spread BTP-Bund sotto i 100 punti base.',
    category: 'mercati',
  },
  {
    id: 'n-3',
    title: 'Bitcoin supera i 65.000$, gli ETF spot registrano afflussi record',
    source: 'CoinDesk',
    url: 'https://example.com/btc-65000',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    summary:
      'Il rally delle criptovalute prosegue, con Ethereum che segue a +4,5% e Sol che segna nuovi massimi.',
    category: 'crypto',
  },
  {
    id: 'n-4',
    title: 'Eni annuncia nuovo piano industriale, focus su rinnovabili e gas',
    source: 'La Stampa',
    url: 'https://example.com/eni-piano',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    summary:
      'Il gruppo petrolifero italiano accelera la transizione energetica con 8 miliardi di investimenti green.',
    category: 'aziende',
  },
  {
    id: 'n-5',
    title: 'Risparmio gestito in Italia: +12% nel 2026, preferiti i fondi obbligazionari',
    source: 'Morningstar',
    url: 'https://example.com/risparmio-gestito',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    summary:
      'Cresce la domanda di prodotti a basso rischio. ETF world e fondi PIR sempre più popolari.',
    category: 'economia',
  },
  {
    id: 'n-6',
    title: 'Bonus 2026: come ottimizzare il TFR per ridurre il carico fiscale',
    source: 'Corriere della Sera',
    url: 'https://example.com/bonus-tfr',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    summary:
      'Confronto tra TFR in azienda e previdenza complementare, quando conviene cambiare.',
    category: 'personale',
  },
  {
    id: 'n-7',
    title: 'Spread BTP-Bund scende sotto i 95 punti, mercati ottimisti',
    source: 'Bloomberg',
    url: 'https://example.com/btp-bund',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    summary: 'Il differenziale con i titoli tedeschi continua a stringersi, segnale di fiducia.',
    category: 'mercati',
  },
  {
    id: 'n-8',
    title: 'Apple: nuovi iPhone 17 spingono le previsioni di vendita',
    source: 'Reuters',
    url: 'https://example.com/apple-iphone17',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    summary: 'Gli analisti alzano il target price a 250$ dopo l\'annuncio delle funzioni AI.',
    category: 'aziende',
  },
  {
    id: 'n-9',
    title: 'Mutui: tassi fissi sotto il 3%, è il momento giusto?',
    source: 'Il Sole 24 Ore',
    url: 'https://example.com/mutui-tassi',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    summary: 'Le banche offrono condizioni competitive per i mutui prima casa, TAEG al minimo storico.',
    category: 'personale',
  },
  {
    id: 'n-10',
    title: 'Inflazione area euro: -0,3% su base mensile, alimentari in calo',
    source: 'Eurostat',
    url: 'https://example.com/inflazione-eurostat',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    summary: 'I dati confermano il trend disinflazionistico in tutta Europa.',
    category: 'economia',
  },
  {
    id: 'n-11',
    title: 'ETF: i 5 fondi più sottoscritti dagli italiani nel 2026',
    source: 'Morningstar',
    url: 'https://example.com/etf-top-5',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    summary: 'VWRL, iShares Core MSCI World e Amundi MSCI Europe guidano la classifica.',
    category: 'mercati',
  },
  {
    id: 'n-12',
    title: 'Regole di gestione finanziaria personale: il metodo 50/30/20',
    source: 'Personal Finance Lab',
    url: 'https://example.com/metodo-50-30-20',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    summary: 'Come ripartire lo stipendio tra necessità, desideri e risparmio in modo sostenibile.',
    category: 'personale',
  },
];