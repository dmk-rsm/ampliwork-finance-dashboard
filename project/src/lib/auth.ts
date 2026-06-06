import { LoggedInUser } from '../types';

const LOCAL_STORAGE_KEY = 'circuit_dashboard_user';

/**
 * Retrieve the logged-in user from localStorage (safe for SSR).
 */
export function getUser(): LoggedInUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LoggedInUser;
  } catch (err) {
    console.error('Failed to parse user session', err);
    return null;
  }
}

/**
 * Store the logged-in user details to localStorage (safe for SSR).
 */
export function setUser(user: LoggedInUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to set user session', err);
  }
}

/**
 * Clear the logged-in user details from localStorage (safe for SSR).
 */
export function clearUser(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear user session', err);
  }
}

/**
 * A custom fetcher for SWR that automatically attaches the user's ID
 * as a Bearer token in the Authorization header to secure API routes.
 */
export const authFetcher = async (url: string) => {
  const user = getUser();
  const headers: HeadersInit = {};
  
  if (user) {
    headers['Authorization'] = `Bearer ${user.id}`;
  }

  const res = await fetch(url, { headers });
  
  if (!res.ok) {
    if (res.status === 401) {
      // Token is invalid or missing, clear session and redirect to login
      clearUser();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    throw new Error('API request failed');
  }
  
  return res.json();
};
