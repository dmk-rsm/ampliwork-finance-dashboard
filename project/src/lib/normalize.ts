import userData from '../../data/users/user.json';

import { User, NormalizedTransaction, ChaseRawTransaction, BoaRawTransaction, AmexRawTransaction } from '../types';

const users = userData.users as User[];

/**
 * Helper to look up user from user.json by matching their name.
 */
export function lookupUserByName(name: string): User | null {
  if (!name) return null;
  const match = users.find(u => u.name.toLowerCase().trim() === name.toLowerCase().trim());
  return match || null;
}

/**
 * Standardize category names for consistency across banks if needed,
 * or default to capitalized versions.
 */
export function normalizeCategory(category: string): string {
  if (!category) return 'Other';
  const cat = category.toUpperCase().trim();
  
  if (cat.includes('MARKETING') || cat.includes('ADVERTISING')) return 'Marketing';
  if (cat.includes('TRAVEL') || cat.includes('TRANSPORTATION') || cat.includes('LODGING') || cat.includes('AIRLINE')) return 'Travel';
  if (cat.includes('SOFTWARE') || cat.includes('INFRASTRUCTURE') || cat.includes('COMPUTER SERVICES')) return 'Infrastructure';
  if (cat.includes('SAAS')) return 'SaaS';
  if (cat.includes('FOOD_AND_DRINK') || cat.includes('DINING') || cat.includes('RESTAURANT')) return 'Dining';
  if (cat.includes('BILLS_AND_UTILITIES') || cat.includes('UTILITIES')) return 'Utilities';
  if (cat.includes('FEES') || cat.includes('PAYMENT PROCESSING') || cat.includes('PAYMENT')) return 'Payment Processing';
  if (cat.includes('INVESTMENT') || cat.includes('FUNDING')) return 'Funding';
  if (cat.includes('REVENUE')) return 'Revenue';
  if (cat.includes('SHOPPING') || cat.includes('EQUIPMENT')) return 'Equipment';
  if (cat.includes('CONTRACTORS')) return 'Contractors';
  if (cat.includes('OFFICE')) return 'Office';
  if (cat.includes('PROFESSIONAL') || cat.includes('LEGAL')) return 'Legal';
  if (cat.includes('PAYROLL')) return 'Payroll';

  // Return formatted name
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

/**
 * Map Chase transaction structure to NormalizedTransaction.
 */
export function normalizeChaseTransaction(tx: ChaseRawTransaction): NormalizedTransaction {
  const authorizedBy = tx.initiatedBy?.name ? lookupUserByName(tx.initiatedBy.name) : null;
  const amount = tx.amount; // Chase is already signed correctly (- for DEBIT, + for CREDIT)
  const type = tx.transactionType?.toLowerCase() === 'credit' ? 'credit' : 'debit';
  
  return {
    id: `chase-${tx.transactionId}`,
    date: tx.transactionDate || tx.postingDate,
    description: tx.description || '',
    amount,
    currency: tx.currency || 'USD',
    type,
    category: normalizeCategory(tx.categoryName || tx.categoryCode || 'Other'),
    vendor: tx.merchantName || tx.description || 'Unknown Vendor',
    bank: 'chase',
    authorizedBy,
    source: tx
  };
}

/**
 * Map BoA transaction structure to NormalizedTransaction.
 */
export function normalizeBoaTransaction(tx: BoaRawTransaction): NormalizedTransaction {
  const authorizedBy = tx.originator?.name ? lookupUserByName(tx.originator.name) : null;
  const isCredit = tx.debitCreditMemo === 'CREDIT';
  const amount = isCredit ? tx.amount : -tx.amount; // BoA amount is positive, apply debit credit memo
  const type = isCredit ? 'credit' : 'debit';

  return {
    id: `boa-${tx.id}`,
    date: tx.transactionDate || tx.postedDate,
    description: tx.description || '',
    amount,
    currency: tx.currencyCode || 'USD',
    type,
    category: normalizeCategory(tx.spendingCategory || 'Other'),
    vendor: tx.payee || 'Unknown Vendor',
    bank: 'boa',
    authorizedBy,
    source: tx
  };
}

/**
 * Map Amex charge structure to NormalizedTransaction.
 */
export function normalizeAmexTransaction(tx: AmexRawTransaction): NormalizedTransaction {
  const authorizedBy = tx.employee?.name ? lookupUserByName(tx.employee.name) : null;
  // Amex: amountInCents (positive for charge/debit, e.g. 310000; negative for payment/credit, e.g. -2640000).
  // Thus normalized amount = -amountInCents / 100.
  // Google Ads charge: amountInCents = 310000 -> normalized = -3100 (debit)
  // Stripe Payout payment: amountInCents = -2640000 -> normalized = 26400 (credit)
  const amount = -tx.amountInCents / 100;
  const type = amount >= 0 ? 'credit' : 'debit';

  return {
    id: `amex-${tx.chargeId}`,
    date: tx.transactionDate || tx.postDate,
    description: tx.memo || tx.merchant?.name || '',
    amount,
    currency: tx.billingCurrency || 'USD',
    type,
    category: normalizeCategory(tx.merchant?.category || 'Other'),
    vendor: tx.merchant?.name || 'Unknown Vendor',
    bank: 'amex',
    authorizedBy,
    source: tx
  };
}
