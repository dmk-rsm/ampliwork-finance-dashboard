'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { getUser } from '../../../lib/auth';
import { canAccessTab, getDefaultTab } from '../../../lib/rbac';
import { LoggedInUser, User } from '../../../types';
import { authFetcher } from '../../../lib/auth';

interface AuditEvent {
  timestamp: string;
  user: string;
  role: string;
  action: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'INFO';
}

export default function SecurityTab() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);

  // Fetch users directory dynamically from Next.js API Routes (no JSON imports)
  const { data: usersData, error: usersError } = useSWR('/api/users', authFetcher);
  const users = usersData?.users || [];

  useEffect(() => {
    const active = getUser();
    if (!active) {
      router.push('/login');
      return;
    }
    // RBAC check via helper
    if (!canAccessTab(active, 'custom')) {
      router.push(`/dashboard/${getDefaultTab(active)}`);
      return;
    }
    setCurrentUser(active);
  }, [router]);

  // Mocked audit trail events
  const auditLogs: AuditEvent[] = [
    {
      timestamp: '2026-06-05 21:15:02',
      user: currentUser?.name || 'Alex Rivera',
      role: currentUser?.role || 'admin',
      action: 'User Authenticated Session Initialized',
      ipAddress: '192.168.1.104',
      status: 'SUCCESS',
    },
    {
      timestamp: '2026-06-05 21:08:12',
      user: 'Priya Shah',
      role: 'finance_lead',
      action: 'Transactions CSV Export Triggered (All Banks)',
      ipAddress: '192.168.1.187',
      status: 'INFO',
    },
    {
      timestamp: '2026-06-05 19:42:30',
      user: 'Marcus Chen',
      role: 'analyst',
      action: 'Unauthorized tab access request (/dashboard/custom) blocked',
      ipAddress: '192.168.1.55',
      status: 'WARNING',
    },
    {
      timestamp: '2026-06-05 18:30:15',
      user: 'Jordan Lee',
      role: 'viewer',
      action: 'User Authenticated Session Initialized',
      ipAddress: '192.168.1.202',
      status: 'SUCCESS',
    },
    {
      timestamp: '2026-06-05 17:15:44',
      user: 'Priya Shah',
      role: 'finance_lead',
      action: 'User Authenticated Session Initialized',
      ipAddress: '192.168.1.187',
      status: 'SUCCESS',
    },
    {
      timestamp: '2026-06-05 15:00:01',
      user: 'SYSTEM',
      role: 'cron_scheduler',
      action: 'Static exchange rates successfully validated (rates.json)',
      ipAddress: '127.0.0.1',
      status: 'SUCCESS',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-wide uppercase text-white">Audit & Security Log</h1>
        <p className="text-xs text-gray-500 font-light mt-0.5 uppercase tracking-wide">
          Access control matrix and session logs (Restricted to Administration)
        </p>
      </div>

      {/* Grid: User Directory */}
      <div className="p-6 bg-[#0d0e14]/80 border border-[#161720] rounded-xl shadow-lg space-y-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Registered Users & Allowed Tabs</h4>
          <p className="text-[10px] text-gray-500 font-light mt-0.5 uppercase tracking-wide">
            Core users dynamically retrieved with RBAC authorizations
          </p>
        </div>

        <div className="overflow-x-auto border border-[#161720] rounded-lg bg-[#0d0e14]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#161720] text-[9px] text-gray-400 tracking-wider uppercase font-semibold bg-[#0d0e14]/60">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Access Rights</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161720] font-light">
              {usersError && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-red-400">
                    Failed to fetch user directory.
                  </td>
                </tr>
              )}
              {!usersError && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">
                    Loading user directory...
                  </td>
                </tr>
              )}
              {!usersError && users.map((usr: User) => (
                <tr key={usr.id} className="hover:bg-[#161722]/30 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-gray-200">
                    <div className="flex flex-col">
                      <span>{usr.name}</span>
                      <span className="text-[10px] text-gray-500 font-light">{usr.email}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-400">{usr.title}</td>
                  <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px] capitalize">{usr.role.replace('_', ' ')}</td>
                  <td className="py-3.5 px-4 text-gray-400">{usr.department}</td>
                  <td className="py-3.5 px-4 font-light">
                    <div className="flex flex-wrap gap-1">
                      {usr.allowedTabs.map((tab: string) => (
                        <span
                          key={tab}
                          className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] font-medium text-zinc-400 uppercase tracking-wide"
                        >
                          {tab}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="flex items-center text-[10px] uppercase font-semibold tracking-wider text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Audit Trail */}
      <div className="p-6 bg-[#0d0e14]/80 border border-[#161720] rounded-xl shadow-lg space-y-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-white">System Security Log</h4>
          <p className="text-[10px] text-gray-500 font-light mt-0.5 uppercase tracking-wide">
            Chronological log of authentication events and secure API transactions
          </p>
        </div>

        <div className="overflow-x-auto border border-[#161720] rounded-lg bg-[#0d0e14]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#161720] text-[9px] text-gray-400 tracking-wider uppercase font-semibold bg-[#0d0e14]/60">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4 text-right">Security Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161720] font-mono text-[11px] leading-relaxed">
              {auditLogs.map((log, idx) => {
                const getStatusStyle = (status: string) => {
                  switch (status) {
                    case 'SUCCESS':
                      return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40';
                    case 'WARNING':
                      return 'bg-amber-950/40 text-amber-400 border-amber-800/40';
                    default:
                      return 'bg-blue-950/40 text-blue-400 border-blue-800/40';
                  }
                };
                return (
                  <tr key={idx} className="hover:bg-[#161722]/30 transition-colors">
                    <td className="py-3.5 px-4 text-gray-500">{log.timestamp}</td>
                    <td className="py-3.5 px-4 text-gray-300 font-sans">{log.user}</td>
                    <td className="py-3.5 px-4 text-gray-400">{log.ipAddress}</td>
                    <td className="py-3.5 px-4 text-zinc-300 font-sans font-light">{log.action}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`px-2 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider ${getStatusStyle(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
