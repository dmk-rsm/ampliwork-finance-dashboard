import { NextRequest } from 'next/server';
import usersData from '../../data/users/user.json';

/**
 * Validates the Authorization Bearer token from the incoming request.
 * Returns true if the token matches a valid user ID, false otherwise.
 */
export function checkApiAuth(request: NextRequest | Request): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.split(' ')[1];
  
  // Verify that the token corresponds to an active user ID
  return usersData.users.some(u => u.id === token && u.active);
}
