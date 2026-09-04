import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper for Yahoo Finance quote fetching with proper headers and timeout
async function fetchYahooFinanceQuote(ticker: string): Promise<{
  symbol: string;
  price: number;
  previousClose: number;
  marketTime: number;
  currency: string;
  exchange: string;
} | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const regularPrice = meta.regularMarketPrice ?? meta.chartPreviousClose;
    if (typeof regularPrice !== 'number' || regularPrice <= 0) return null;

    return {
      symbol: meta.symbol || ticker,
      price: regularPrice,
      previousClose: meta.chartPreviousClose ?? meta.previousClose ?? regularPrice,
      marketTime: meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now(),
      currency: meta.currency || 'INR',
      exchange: meta.exchangeName || (ticker.endsWith('.BO') ? 'BSE' : 'NSE'),
    };
  } catch (err) {
    return null;
  }
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. Single Stock/ETF Quote API
app.get('/api/market-price/stock', async (req, res) => {
  const symbol = (req.query.symbol as string || '').trim().toUpperCase();
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const cleanSymbol = symbol.replace(/\.NS$|\.BO$/, '');
  const tickersToTry = [`${cleanSymbol}.NS`, `${cleanSymbol}.BO`];

  for (const ticker of tickersToTry) {
    const quote = await fetchYahooFinanceQuote(ticker);
    if (quote) {
      const changeAmount = Math.round((quote.price - quote.previousClose) * 100) / 100;
      const changePercentage = quote.previousClose > 0
        ? Math.round((changeAmount / quote.previousClose) * 10000) / 100
        : 0;

      return res.json({
        symbolOrIdentifier: cleanSymbol,
        price: Math.round(quote.price * 100) / 100,
        currency: quote.currency,
        source: ticker.endsWith('.BO') ? 'BSE' : 'NSE',
        timestamp: new Date().toISOString(),
        asOfDate: new Date(quote.marketTime).toISOString(),
        freshness: 'LIVE',
        changeAmount,
        changePercentage,
        isSuccess: true,
      });
    }
  }

  res.status(404).json({
    symbolOrIdentifier: cleanSymbol,
    price: 0,
    currency: 'INR',
    source: 'MANUAL',
    timestamp: new Date().toISOString(),
    isSuccess: false,
    errorMessage: `Could not fetch live market quote for ${cleanSymbol}`,
  });
});

// 3. Single Mutual Fund NAV API (via AMFI Open API)
app.get('/api/market-price/mf', async (req, res) => {
  const schemeCode = (req.query.schemeCode as string || '').trim();
  if (!schemeCode || !/^\d{5,7}$/.test(schemeCode)) {
    return res.status(400).json({ error: 'Valid 5-7 digit numeric schemeCode is required' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        const latest = data.data[0];
        const nav = parseFloat(latest.nav);
        if (!isNaN(nav) && nav > 0) {
          let changeAmount: number | undefined;
          let changePercentage: number | undefined;

          if (data.data.length > 1) {
            const prevNav = parseFloat(data.data[1].nav);
            if (!isNaN(prevNav) && prevNav > 0) {
              changeAmount = Math.round((nav - prevNav) * 100) / 100;
              changePercentage = Math.round((changeAmount / prevNav) * 10000) / 100;
            }
          }

          return res.json({
            symbolOrIdentifier: schemeCode,
            schemeName: data.meta?.scheme_name,
            price: Math.round(nav * 100) / 100,
            currency: 'INR',
            source: 'AMFI',
            timestamp: new Date().toISOString(),
            asOfDate: latest.date,
            freshness: 'LIVE',
            changeAmount,
            changePercentage,
            isSuccess: true,
          });
        }
      }
    }
  } catch (err: any) {
    // Network or timeout
  }

  res.status(404).json({
    symbolOrIdentifier: schemeCode,
    price: 0,
    currency: 'INR',
    source: 'AMFI',
    timestamp: new Date().toISOString(),
    isSuccess: false,
    errorMessage: `AMFI API request for scheme code ${schemeCode} failed.`,
  });
});

// 4. Batch Price Refresh API for high-performance concurrent resolution
app.post('/api/market-price/batch', async (req, res) => {
  const items = req.body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array is required' });
  }

  const results = await Promise.all(
    items.map(async (item: { type: string; identifier: string; name?: string }) => {
      const type = (item.type || 'STOCK').toUpperCase();
      const id = (item.identifier || '').trim();

      if (type === 'MUTUAL_FUND' || type === 'MUTUAL_FUNDS') {
        if (/^\d{5,7}$/.test(id)) {
          try {
            const r = await fetch(`https://api.mfapi.in/mf/${id}`);
            if (r.ok) {
              const d = await r.json();
              if (d?.data?.[0]?.nav) {
                const nav = parseFloat(d.data[0].nav);
                const prev = d.data[1]?.nav ? parseFloat(d.data[1].nav) : nav;
                const changeAmount = Math.round((nav - prev) * 100) / 100;
                const changePercentage = prev > 0 ? Math.round((changeAmount / prev) * 10000) / 100 : 0;
                return {
                  identifier: id,
                  type,
                  price: Math.round(nav * 100) / 100,
                  currency: 'INR',
                  source: 'AMFI',
                  asOfDate: d.data[0].date,
                  changeAmount,
                  changePercentage,
                  isSuccess: true,
                };
              }
            }
          } catch {}
        }
      } else if (type === 'STOCK' || type === 'ETF') {
        const cleanSym = id.replace(/\.NS$|\.BO$/, '');
        for (const ticker of [`${cleanSym}.NS`, `${cleanSym}.BO`]) {
          const q = await fetchYahooFinanceQuote(ticker);
          if (q) {
            const changeAmount = Math.round((q.price - q.previousClose) * 100) / 100;
            const changePercentage = q.previousClose > 0 ? Math.round((changeAmount / q.previousClose) * 10000) / 100 : 0;
            return {
              identifier: cleanSym,
              type,
              price: Math.round(q.price * 100) / 100,
              currency: q.currency,
              source: ticker.endsWith('.BO') ? 'BSE' : 'NSE',
              asOfDate: new Date(q.marketTime).toISOString(),
              changeAmount,
              changePercentage,
              isSuccess: true,
            };
          }
        }
      }

      return {
        identifier: id,
        type,
        price: 0,
        currency: 'INR',
        source: 'MANUAL',
        isSuccess: false,
        errorMessage: `Quote unavailable for ${id}`,
      };
    })
  );

  res.json({
    timestamp: new Date().toISOString(),
    results,
  });
});

// Vite middleware & Static Serving setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const cleanup = () => {
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 1500).unref();
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
}

startServer();
