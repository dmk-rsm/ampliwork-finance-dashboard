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
