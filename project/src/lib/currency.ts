import ratesData from '../../data/rates.json';

export interface Rates {
  USD: number;
  EUR: number;
  GBP: number;
  CAD: number;
  [key: string]: number;
}

export const staticRates: Rates = ratesData.rates;

/**
 * Convert an amount from one currency to another using exchange rates.
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: Rates = staticRates
): number {
  const normalizedFrom = from.toUpperCase();
  const normalizedTo = to.toUpperCase();
  
  if (normalizedFrom === normalizedTo) return amount;
  
  const rateFrom = rates[normalizedFrom];
  const rateTo = rates[normalizedTo];
  
  if (rateFrom === undefined || rateTo === undefined) {
    return amount;
  }
  
  // Convert from currency C -> USD: amount * rateFrom
  // Convert from USD -> currency T: amountInUSD / rateTo
  const amountInUSD = amount * rateFrom;
  return amountInUSD / rateTo;
}

/**
 * Format currency amount cleanly with locale defaults.
 */
export function formatCurrency(amount: number, currency: string): string {
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
