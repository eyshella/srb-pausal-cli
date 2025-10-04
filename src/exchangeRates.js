/**
 * Exchange rate utilities with database caching
 * Uses rate providers for fetching EUR to RSD rates
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

/**
 * Fetch EUR to RSD exchange rate using Serbia provider
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<number>} - Exchange rate
 */
export async function fetchEurToRsdRate(date) {
  // Check if we have it cached in database
  const cached = getExchangeRate(date, 'EUR', 'RSD');
  if (cached) {
    console.log(`Using cached EUR/RSD rate for ${date}: ${cached}`);
    return cached;
  }

  try {
    // Initialize providers if needed
    await initProviders();

    // Fetch rates from Serbia provider (NBS)
    console.log(`Fetching EUR/RSD rate from NBS for ${date}...`);
    const rates = await serbiaProvider.getRates(date);
    
    // EUR rate from NBS
    const eurRate = parseFloat(rates['EUR']);
    
    if (!eurRate || isNaN(eurRate)) {
      throw new Error('EUR rate not found in NBS response');
    }

    console.log(`Fetched EUR/RSD rate for ${date}: ${eurRate}`);

    // Cache the rate in database
    saveExchangeRate(date, 'EUR', 'RSD', eurRate);
    
    // Also cache other common currencies for future use
    Object.entries(rates).forEach(([currency, rate]) => {
      if (currency !== 'EUR') {
        saveExchangeRate(date, currency, 'RSD', parseFloat(rate));
      }
    });

    return eurRate;
  } catch (error) {
    console.error(`Error fetching exchange rate for ${date}:`, error.message);
    
    // Try fallback to Europe provider
    try {
      console.log(`Trying fallback to ECB for ${date}...`);
      const europeRates = await europeProvider.getRates(date);
      
      // ECB provides rates FROM EUR, so we need RSD rate
      const rsdRate = parseFloat(europeRates['RSD']);
      
      if (!rsdRate || isNaN(rsdRate)) {
        throw new Error('RSD rate not found in ECB response');
      }

      console.log(`Fetched EUR/RSD rate from ECB for ${date}: ${rsdRate}`);
      
      // Cache the rate
      saveExchangeRate(date, 'EUR', 'RSD', rsdRate);
      
      return rsdRate;
    } catch (fallbackError) {
      console.error(`Fallback also failed:`, fallbackError.message);
      throw new Error(`Could not fetch exchange rate for ${date} from any provider`);
    }
  }
}

/**
 * Fetch EUR to RSD rates for multiple dates
 * @param {string[]} dates - Array of dates in YYYY-MM-DD format
 * @returns {Promise<Object>} - Object mapping dates to rates
 */
export async function fetchMultipleRates(dates) {
  const rates = {};
  
  for (const date of dates) {
    try {
      rates[date] = await fetchEurToRsdRate(date);
    } catch (error) {
      console.error(`Failed to fetch rate for ${date}:`, error.message);
      rates[date] = null;
    }
  }
  
  return rates;
}

/**
 * Get EUR to RSD rate for a date, fetching if not cached
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<number>} - Exchange rate
 */
export async function getOrFetchRate(date) {
  const cached = getExchangeRate(date, 'EUR', 'RSD');
  if (cached) {
    return cached;
  }
  return await fetchEurToRsdRate(date);
}

/**
 * Get rate between any two currencies for a date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number>} - Exchange rate
 */
export async function getRate(date, fromCurrency, toCurrency) {
  // Check cache first
  const cached = getExchangeRate(date, fromCurrency, toCurrency);
  if (cached) {
    return cached;
  }

  // If not in cache, we need to fetch and calculate
  await initProviders();
  
  // Special case: EUR to USD or other currencies via ECB
  if (fromCurrency === 'EUR') {
    try {
      const europeRates = await europeProvider.getRates(date);
      const rate = parseFloat(europeRates[toCurrency]);
      
      if (rate && !isNaN(rate)) {
        // Cache it
        saveExchangeRate(date, fromCurrency, toCurrency, rate);
        return rate;
      }
    } catch (error) {
      console.log(`ECB doesn't have ${toCurrency} rate, trying Serbia provider...`);
    }
  }
  
  // Use Serbia provider as fallback
  try {
    const rates = await serbiaProvider.getRates(date);
    
    // Both currencies should be in the rates object (as rates to RSD)
    const fromRate = parseFloat(rates[fromCurrency]);
    const toRate = parseFloat(rates[toCurrency]);
    
    if (!fromRate || !toRate) {
      throw new Error(`Currencies ${fromCurrency} or ${toCurrency} not found`);
    }

    // Calculate cross rate: fromCurrency to toCurrency
    // If both are in RSD, we calculate: (1 FROM in RSD) / (1 TO in RSD)
    const crossRate = fromRate / toRate;
    
    // Cache it
    saveExchangeRate(date, fromCurrency, toCurrency, crossRate);
    
    return crossRate;
  } catch (error) {
    console.error(`Error calculating ${fromCurrency}/${toCurrency} rate:`, error.message);
    throw error;
  }
}

/**
 * Cleanup providers on exit
 */
export async function cleanupProviders() {
  await serbiaProvider.dispose();
  await europeProvider.dispose();
  providersInitialized = false;
}
