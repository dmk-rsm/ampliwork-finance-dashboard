import { NextResponse } from 'next/server';
import amexData from '../../../../../../data/transactions/amex.json';
import { checkApiAuth } from '../../../../../lib/api-auth';

export async function GET(request: Request) {
  if (!checkApiAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(amexData);
}
