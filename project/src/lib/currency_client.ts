/**
 * Pure client-side currency utilities with ZERO direct JSON imports.
 */

export interface Rates {
  [key: string]: number;
}

/**
 * Convert an amount from one currency to another using a provided rates map.
 */
export function convertCurrencyClient(
  amount: number,
  from: string,
  to: string,
  rates: Rates
): number {
  if (!rates) return amount;
  
  const normalizedFrom = from.toUpperCase();
  const normalizedTo = to.toUpperCase();
  
  if (normalizedFrom === normalizedTo) return amount;
  
  const rateFrom = rates[normalizedFrom];
  const rateTo = rates[normalizedTo];
  
  if (rateFrom === undefined || rateTo === undefined) {
    return amount;
  }
  
  // Convert from currency -> USD, then USD -> to currency
  const amountInUSD = amount * rateFrom;
  return amountInUSD / rateTo;
}

/**
 * Format currency amount cleanly with locale defaults.
 */
export function formatCurrencyClient(amount: number, currency: string): string {
  const normalizedCurrency = currency.toUpperCase();
  let locale = 'en-US';
  if (normalizedCurrency === 'EUR') locale = 'fr-FR';
  else if (normalizedCurrency === 'GBP') locale = 'en-GB';
  else if (normalizedCurrency === 'CAD') locale = 'en-CA';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: normalizedCurrency,
  }).format(amount);
}
