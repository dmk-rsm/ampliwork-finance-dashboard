// --- Strict union types for RBAC and currency ---

export type UserRole = 'admin' | 'finance_lead' | 'analyst' | 'viewer';
export type TabName = 'transactions' | 'stats' | 'custom';
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD';

export interface User {
  id: string;
  email: string;
  name: string;
  title: string;
  role: UserRole;
  allowedTabs: TabName[];
  department: string;
  active: boolean;
  createdAt: string;
}

export interface LoggedInUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  allowedTabs: TabName[];
  department: string;
}

// --- Raw bank transaction types ---

export interface ChaseRawTransaction {
  transactionId: string;
  postingDate: string;
  transactionDate: string;
  description: string;
  amount: number;
  transactionType: string;
  categoryCode: string;
  categoryName: string;
  merchantName: string;
  initiatedBy?: {
    name: string;
    department?: string;
  };
  pending?: boolean;
  currency: string;
  originalAmount?: number;
}

export interface BoaRawTransaction {
  id: string;
  transactionDate: string;
  postedDate: string;
  payee: string;
  description: string;
  amount: number;
  debitCreditMemo: string; // Typically 'DEBIT' | 'CREDIT'
  transactionType: string;
  spendingCategory: string;
  originator?: {
    name: string;
    department?: string;
  };
  currencyCode: string;
  originalAmount?: number;
  runningBalance?: number;
  status?: string;
}

export interface AmexRawTransaction {
  chargeId: string;
  transactionDate: string;
  postDate: string;
  merchant?: {
    name: string;
    category: string;
    categoryCode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  amountInCents: number;
  amountDisplay?: string;
  type: string;
  status?: string;
  rewardEligible?: boolean;
  memo?: string;
  employee?: {
    name: string;
    department?: string;
  };
  billingCurrency: string;
  originalAmountInCents?: number;
}

export type RawBankTransaction = ChaseRawTransaction | BoaRawTransaction | AmexRawTransaction;

export interface NormalizedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number; // Signed original amount: debit/outflow is negative, credit/inflow is positive
  currency: string;
  type: 'debit' | 'credit';
  category: string;
  vendor: string;
  bank: 'chase' | 'boa' | 'amex';
  authorizedBy: User | null;
  source: RawBankTransaction;
}
