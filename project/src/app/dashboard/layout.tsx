'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUser, clearUser } from '../../lib/auth';
import { canAccessTab, getDefaultTab, filterAllowedTabs } from '../../lib/rbac';
import { LoggedInUser } from '../../types';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUserState] = useState<LoggedInUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Authenticate user on mount and route changes
  useEffect(() => {
    const activeUser = getUser();
    if (!activeUser) {
      router.push('/login');
      return;
    }

    setUserState(activeUser);

    // Determine current tab from pathname
    const currentTab = pathname.split('/').pop() || '';
    
    // Perform RBAC access check if visiting sub-tabs
    if (currentTab && ['transactions', 'stats', 'custom'].includes(currentTab)) {
      if (!canAccessTab(activeUser, currentTab as 'transactions' | 'stats' | 'custom')) {
        router.push(`/dashboard/${getDefaultTab(activeUser)}`);
        return;
      }
    }

    setLoading(false);
  }, [pathname, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#07080c] flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs uppercase tracking-[0.2em] text-gray-500 font-light">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  // Sidebar Tabs Config
  const tabs = [
    {
      id: 'stats',
      label: 'Stats',
      path: '/dashboard/stats',
      icon: (
        <svg className="w-[18px] h-[18px] mb-1 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M4 20h16M4 20V12m4 8V8m4 12v-6m4 6V6m4 14v-8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 'transactions',
      label: 'Workspace',
      path: '/dashboard/transactions',
      icon: (
        <svg className="w-[18px] h-[18px] mb-1 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x={4} y={4} width={16} height={16} rx={2} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 9h6m-6 3h6m-6 3h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 'custom',
      label: 'Security',
      path: '/dashboard/custom',
      icon: (
        <svg className="w-[18px] h-[18px] mb-1 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      )
    }
  ];

  // Filter based on RBAC
  const allowedSidebarTabs = filterAllowedTabs(tabs, user);
  const activeTab = pathname.split('/').pop() || 'transactions';

  return (
    <div className="flex h-screen bg-[#07080c] text-gray-200 font-sans overflow-hidden">
      {/* Sidebar: Styled matching wireframe */}
      <aside className="w-20 border-r border-[#161720] bg-[#090a0f] flex flex-col justify-between items-center py-6">
        
        {/* Top Section: Triangle Logo */}
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 flex items-center justify-center cursor-pointer group" onClick={() => router.push('/')}>
            {/* Blue Triangle Logo */}
            <svg viewBox="0 0 100 100" className="w-8 h-8 fill-sky-500 group-hover:scale-105 transition-transform duration-200">
              <polygon points="50,15 90,85 10,85" />
            </svg>
          </div>

          {/* Navigation Links */}
          <nav className="mt-12 flex flex-col items-center space-y-6 w-full">
            {allowedSidebarTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => router.push(tab.path)}
                  className={`w-full flex flex-col items-center py-2.5 transition-all duration-150 border-l-[3px] ${
                    isActive
                      ? 'border-sky-500 text-sky-400 font-medium bg-sky-950/10'
                      : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  <span className="text-[9px] uppercase tracking-wider font-light mt-1 scale-90">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Settings Icon & User Profile Avatar */}
        <div className="flex flex-col items-center space-y-6">
          {/* Settings cog */}
          <button
            onClick={() => {
              if (user.role === 'admin' || user.role === 'finance_lead') {
                router.push('/dashboard/custom');
              }
            }}
            className="text-gray-500 hover:text-gray-300 p-1.5 rounded-md hover:bg-white/5 transition-all"
            title="Settings / Security Log"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.645-.869L9.594 3.94ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            </svg>
          </button>

          {/* User profile picture */}
          <div
            onClick={() => setShowLogoutModal(true)}
            className="h-9 w-9 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md border border-white/20 cursor-pointer overflow-hidden hover:opacity-85 transition-opacity"
            title={`${user.name} (${user.email}) - Click to logout`}
          >
            {/* Render a custom profile icon since we don't have images */}
            <svg className="w-5 h-5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#07080c] overflow-y-auto">
        <div className="p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f111a] border border-[#27272a] rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-white mb-2">Sign Out</h3>
            <p className="text-gray-400 text-sm mb-6">Are you sure you want to end your session?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded bg-transparent hover:bg-white/5 border border-[#27272a] text-gray-300 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearUser();
                  router.push('/login');
                }}
                className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
