import { NextResponse } from 'next/server';
import amexData from '../../../../../../data/transactions/amex.json';

export async function GET() {
  return NextResponse.json(amexData);
}
