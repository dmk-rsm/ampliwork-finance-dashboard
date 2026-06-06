import { NextResponse } from 'next/server';
import chaseData from '../../../../../../data/transactions/chase.json';

export async function GET() {
  return NextResponse.json(chaseData);
}
