import { NextResponse } from 'next/server';
import userData from '../../../../data/users/user.json';
import { checkApiAuth } from '../../../lib/api-auth';

export async function GET(request: Request) {
  if (!checkApiAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Strip passwords for security
  const safeUsers = userData.users.map(({ password: _, ...u }) => u);
  return NextResponse.json({
    company: userData.company,
    tabAccessMatrix: userData.tabAccessMatrix,
    users: safeUsers,
  });
}
