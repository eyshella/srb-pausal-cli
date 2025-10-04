/**
 * Exchange rate utilities with database caching.
 *
 * Primary use-case in this app is EUR→RSD for KPO and invoices.
 * Additional helper allows fetching other pairs on demand.
 */

import { saveExchangeRate, getExchangeRate } from './database.js';
import { SerbiaRatesProvider } from './rates-providers/serbia.rates-provider.js';
import { EuropeRatesProvider } from './rates-providers/europe.rates-provider.js';

// Initialize rate providers
const serbiaProvider = new SerbiaRatesProvider();
const europeProvider = new EuropeRatesProvider();

let providersInitialized = false;

/**
 * Initialize rate providers
 */
async function initProviders() {
  if (!providersInitialized) {
    await serbiaProvider.init();
    await europeProvider.init();
    providersInitialized = true;
  }
}

// =====================
// Interval/bulk fetch and cache
// =====================
/**
 * Ensure rates are cached for a date or date interval for a specific pair.
 * Returns a map per date: { [date]: number|null }
 */
export async function getRates(startDate, endDate, fromCurrency, toCurrency, provider) {
  await initProviders();
  const dates = buildDateList(startDate, endDate);
  const result = {};
  if (!provider || (provider !== 'ecb' && provider !== 'nbs')) {
    throw new Error(`Invalid provider: ${provider}. Expected 'ecb' or 'nbs'.`);
  }

  for (const date of dates) {
    // Try cache first
    let rate = getExchangeRate(date, fromCurrency, toCurrency);
    if (rate) {
      result[date] = rate;
      continue;
    }

    if (provider === 'ecb') {
      try {
        const europeRates = await europeProvider.getRates(date);

        const getEcb = (code) => {
          const v = parseFloat(europeRates[code]);
          return v && !isNaN(v) ? v : null;
        };

        if (fromCurrency === 'EUR') {
          const direct = getEcb(toCurrency);
          if (direct) {
            rate = direct; // 1 EUR = direct TO
          }
        } else if (toCurrency === 'EUR') {
          const fromPerEur = getEcb(fromCurrency);
          if (fromPerEur) {
            rate = 1 / fromPerEur; // 1 FROM = 1/fromPerEur EUR
          }
        } else {
          const toPerEur = getEcb(toCurrency);
          const fromPerEur = getEcb(fromCurrency);
          if (toPerEur && fromPerEur) {
            rate = toPerEur / fromPerEur; // cross via EUR
          }
        }

        if (rate && !isNaN(rate)) {
          saveExchangeRate(date, fromCurrency, toCurrency, rate);
          result[date] = rate;
          continue;
        } else {
          throw new Error(`Could not compute ${fromCurrency}→${toCurrency} for ${date} using ECB`);
        }
      } catch (e) {
        console.error(`ECB provider failed for date = ${date}, toCurrency = ${toCurrency}, fromCurrency = ${fromCurrency}, error = ${e.message}`);
        throw e;
      }
    } else if (provider === 'nbs') {
      // Use NBS to compute via RSD base
      try {
        const rs = await serbiaProvider.getRates(date);

        // Helper to parse safely
        const get = (code) => {
          const v = parseFloat(rs[code]);
          return v && !isNaN(v) ? v : null;
        };

        if (toCurrency === 'RSD') {
          const fromRate = get(fromCurrency);
          if (fromRate) {
            rate = fromRate; // 1 FROM = fromRate RSD
          }
        } else if (fromCurrency === 'RSD') {
          const toRate = get(toCurrency);
          if (toRate) {
            rate = 1 / toRate; // 1 RSD = 1/toRate TO
          }
        } else {
          const fromRate = get(fromCurrency);
          const toRate = get(toCurrency);
          if (fromRate && toRate) {
            rate = fromRate / toRate; // cross via RSD
          }
        }

        if (rate && !isNaN(rate)) {
          saveExchangeRate(date, fromCurrency, toCurrency, rate);
          result[date] = rate;
        } else {
          throw new Error(`Could not compute ${fromCurrency}→${toCurrency} for ${date} using NBS`);
        }
      } catch (e) {
        console.error(`NBS provider failed for date = ${date}, toCurrency = ${toCurrency}, fromCurrency = ${fromCurrency}, error = ${e.message}`);
        throw e;
      }
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  }
  return result;
}

function buildDateList(start, end) {
  const list = [];
  if (!end) end = start;
  const d1 = new Date(start);
  const d2 = new Date(end);
  for (let d = new Date(d1); d <= d2; d.setDate(d.getDate() + 1)) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    list.push(`${year}-${month}-${day}`);
  }
  return list;
}

// =====================
// Generic pair on demand
// =====================
/**
 * Get rate between any two currencies for a date.
 * For EUR→X tries ECB first; otherwise falls back to NBS-derived cross rate.
 */
export async function getRate(date, fromCurrency, toCurrency, provider) {
  const map = await getRates(date, date, fromCurrency, toCurrency, provider);
  const rate = map[date];
  if (rate == null) {
    throw new Error(`Rate not available for ${fromCurrency}→${toCurrency} on ${date}`);
  }
  return rate;
}

/**
 * Cleanup providers on exit
 */
export async function cleanupProviders() {
  await serbiaProvider.dispose();
  await europeProvider.dispose();
  providersInitialized = false;
}
