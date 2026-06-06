import { NextRequest, NextResponse } from 'next/server';
import chaseData from '../../../../../data/transactions/chase.json';
import boaData from '../../../../../data/transactions/boa.json';
import amexData from '../../../../../data/transactions/amex.json';
import {
  normalizeChaseTransaction,
  normalizeBoaTransaction,
  normalizeAmexTransaction,
} from '../../../../lib/normalize';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    if (id.startsWith('chase-')) {
      const targetId = id.replace('chase-', '');
      const rawTx = chaseData.transactions.find(
        (t) => t.transactionId === targetId
      );
      if (!rawTx) {
        return NextResponse.json(
          { error: 'Chase transaction not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(normalizeChaseTransaction(rawTx));
    }

    if (id.startsWith('boa-')) {
      const targetId = id.replace('boa-', '');
      const rawTx = boaData.transactionList.find((t) => t.id === targetId);
      if (!rawTx) {
        return NextResponse.json(
          { error: 'BoA transaction not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(normalizeBoaTransaction(rawTx));
    }

    if (id.startsWith('amex-')) {
      const targetId = id.replace('amex-', '');
      const rawTx = amexData.data.charges.find((t) => t.chargeId === targetId);
      if (!rawTx) {
        return NextResponse.json(
          { error: 'Amex charge not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(normalizeAmexTransaction(rawTx));
    }

    return NextResponse.json(
      { error: 'Invalid transaction ID format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to get transaction detail:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the transaction details' },
      { status: 500 }
    );
  }
}
