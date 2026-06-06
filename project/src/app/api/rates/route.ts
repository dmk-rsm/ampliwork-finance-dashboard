import { NextResponse } from 'next/server';
import ratesData from '../../../../data/rates.json';
import { checkApiAuth } from '../../../lib/api-auth';

export async function GET(request: Request) {
  if (!checkApiAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(ratesData);
}
