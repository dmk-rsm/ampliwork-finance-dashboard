import { NextResponse } from 'next/server';
import chaseData from '../../../../../../data/transactions/chase.json';
import { checkApiAuth } from '../../../../../lib/api-auth';

export async function GET(request: Request) {
  if (!checkApiAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(chaseData);
}
