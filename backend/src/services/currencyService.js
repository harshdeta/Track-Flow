const axios = require('axios');

/**
 * Currency Conversion Service
 * Uses ExchangeRate-API to convert amounts between currencies.
 * Falls back to 1:1 rate if API key is not configured.
 *
 * API Docs: https://www.exchangerate-api.com/docs/overview
 */

// Simple in-memory cache: { "USD_INR": { rate: 83.5, expiresAt: timestamp } }
const rateCache = {};
const CACHE_TTL_MS = 60 * 60 * 1000; // Cache rates for 1 hour

/**
 * getExchangeRate — Fetches exchange rate between two currencies.
 * @param {string} from - Source currency code (e.g., 'USD')
 * @param {string} to - Target currency code (e.g., 'INR')
 * @returns {Promise<number>} - Exchange rate (from → to)
 */
const getExchangeRate = async (from, to) => {
  // If same currency, rate is 1
  if (from.toUpperCase() === to.toUpperCase()) return 1;

  const cacheKey = `${from.toUpperCase()}_${to.toUpperCase()}`;
  const now = Date.now();

  // Check cache
  if (rateCache[cacheKey] && rateCache[cacheKey].expiresAt > now) {
    return rateCache[cacheKey].rate;
  }

  // If no API key is configured, return 1 (passthrough) and warn
  if (!process.env.EXCHANGE_RATE_API_KEY || process.env.EXCHANGE_RATE_API_KEY === 'your_api_key_here') {
    console.warn(
      `⚠️  No EXCHANGE_RATE_API_KEY configured. Using 1:1 conversion rate for ${from} → ${to}`
    );
    return 1;
  }

  try {
    const url = `${process.env.EXCHANGE_RATE_API_URL}/${process.env.EXCHANGE_RATE_API_KEY}/pair/${from.toUpperCase()}/${to.toUpperCase()}`;
    const response = await axios.get(url, { timeout: 5000 });

    if (response.data.result !== 'success') {
      throw new Error(`Exchange rate API error: ${response.data['error-type']}`);
    }

    const rate = response.data.conversion_rate;

    // Cache the result
    rateCache[cacheKey] = { rate, expiresAt: now + CACHE_TTL_MS };

    return rate;
  } catch (error) {
    console.error(`❌ Currency conversion failed (${from} → ${to}): ${error.message}`);
    // Graceful fallback to 1:1 rather than breaking the entire expense creation
    return 1;
  }
};

/**
 * convertAmount — Converts an amount from one currency to another.
 * @param {number} amount - Source amount
 * @param {string} from - Source currency
 * @param {string} to - Target currency
 * @returns {Promise<{ convertedAmount: number, rate: number }>}
 */
const convertAmount = async (amount, from, to) => {
  const rate = await getExchangeRate(from, to);
  const convertedAmount = parseFloat((amount * rate).toFixed(2));
  return { convertedAmount, rate };
};

module.exports = { getExchangeRate, convertAmount };
