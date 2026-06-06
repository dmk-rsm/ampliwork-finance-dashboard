import { NextResponse } from 'next/server';
import ratesData from '../../../../data/rates.json';

export async function GET() {
  return NextResponse.json(ratesData);
}
