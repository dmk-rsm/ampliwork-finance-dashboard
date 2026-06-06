'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../lib/auth';

export default function DashboardPage() {
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

  return null;
}
