import { NextResponse } from 'next/server';
import userData from '../../../../data/users/user.json';

export async function GET() {
  // Strip passwords for security
  const safeUsers = userData.users.map(({ password: _, ...u }) => u);
  return NextResponse.json({
    company: userData.company,
    tabAccessMatrix: userData.tabAccessMatrix,
    users: safeUsers,
  });
}
