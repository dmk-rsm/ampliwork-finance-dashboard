import { NextRequest, NextResponse } from 'next/server';
import chaseData from '../../../../data/transactions/chase.json';
import boaData from '../../../../data/transactions/boa.json';
import amexData from '../../../../data/transactions/amex.json';
import {
  normalizeChaseTransaction,
  normalizeBoaTransaction,
  normalizeAmexTransaction,
} from '../../../lib/normalize';
import { NormalizedTransaction } from '../../../types';
import { convertCurrency } from '../../../lib/currency';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bankFilter = searchParams.get('bank'); // chase, boa, amex, or all
    const authorizedByFilter = searchParams.get('authorizedBy'); // user ID
    const amountFilter = searchParams.get('amount'); // threshold in USD (absolute value)
    const fromDateFilter = searchParams.get('fromDate'); // YYYY-MM-DD

    const chaseNormalized = chaseData.transactions.map(normalizeChaseTransaction);
    const boaNormalized = boaData.transactionList.map(normalizeBoaTransaction);
    const amexNormalized = amexData.data.charges.map(normalizeAmexTransaction);

    let allTransactions: NormalizedTransaction[] = [
      ...chaseNormalized,
      ...boaNormalized,
      ...amexNormalized,
    ];

    // Apply bank filter
    if (bankFilter && bankFilter !== 'all') {
      const normalizedBank = bankFilter.toLowerCase();
      allTransactions = allTransactions.filter(
        (tx) => tx.bank.toLowerCase() === normalizedBank
      );
    }

    // Apply authorized by filter
    if (authorizedByFilter && authorizedByFilter !== 'all') {
      allTransactions = allTransactions.filter(
        (tx) => tx.authorizedBy?.id === authorizedByFilter
      );
    }

    // Apply amount filter (absolute USD value >= threshold)
    if (amountFilter) {
      const minAmount = parseFloat(amountFilter);
      if (!isNaN(minAmount)) {
        allTransactions = allTransactions.filter((tx) => {
          const amountInUSD = Math.abs(convertCurrency(tx.amount, tx.currency, 'USD'));
          return amountInUSD >= minAmount;
        });
      }
    }

    // Apply fromDate filter
    if (fromDateFilter) {
      // Normalize dates to start of day for comparison
      const filterTime = new Date(`${fromDateFilter}T00:00:00Z`).getTime();
      if (!isNaN(filterTime)) {
        allTransactions = allTransactions.filter((tx) => {
          const txTime = new Date(`${tx.date}T00:00:00Z`).getTime();
          return txTime >= filterTime;
        });
      }
    }

    // Sort by earliest date first (ascending)
    allTransactions.sort((a, b) => {
      const timeA = new Date(`${a.date}T00:00:00Z`).getTime();
      const timeB = new Date(`${b.date}T00:00:00Z`).getTime();
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return a.id.localeCompare(b.id);
    });

    return NextResponse.json(allTransactions);
  } catch (error) {
    console.error('Failed to get transactions:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching transactions' },
      { status: 500 }
    );
  }
}
