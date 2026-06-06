import { LoggedInUser, TabName } from '../types';

/**
 * Check whether a user's role allows access to a specific tab.
 */
export function canAccessTab(user: LoggedInUser, tab: TabName): boolean {
  if (!user || !user.allowedTabs) return false;
  return user.allowedTabs.includes(tab);
}

/**
 * Get the first allowed tab for a user (used for redirects).
 */
export function getDefaultTab(user: LoggedInUser): TabName {
  if (user.allowedTabs?.includes('transactions')) return 'transactions';
  return (user.allowedTabs?.[0] as TabName) || 'stats';
}

/**
 * Filter a list of tab identifiers down to only those the user is allowed to access.
 */
export function filterAllowedTabs<T extends { id: string }>(
  tabs: T[],
  user: LoggedInUser
): T[] {
  return tabs.filter(tab => canAccessTab(user, tab.id as TabName));
}
