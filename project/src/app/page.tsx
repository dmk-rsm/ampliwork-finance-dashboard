'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../lib/auth';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (user) {
      const dest = user.allowedTabs?.includes('transactions')
        ? '/dashboard/transactions'
        : `/dashboard/${user.allowedTabs?.[0] || 'stats'}`;
      router.push(dest);
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0d0e12] flex items-center justify-center text-white">
      <div className="flex flex-col items-center space-y-4">
        <svg
          className="animate-spin h-8 w-8 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-xs tracking-[0.2em] uppercase text-gray-400">Loading Circuit Labs Dashboard...</span>
      </div>
    </div>
  );
}
