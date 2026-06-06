'use client';

import React, { useState } from 'react';
import { User, NormalizedTransaction } from '../types';
import { formatCurrencyClient, convertCurrencyClient } from '../lib/currency_client';

interface TransactionsTableProps {
  transactions: NormalizedTransaction[];
  loading: boolean;
  selectedCurrency: string; // 'original' or currency code (USD, EUR, GBP, CAD)
  starredIds: Set<string>;
  onToggleStar: (id: string, e: React.MouseEvent) => void;
  onRowClick: (transaction: NormalizedTransaction) => void;
  rates: Record<string, number> | undefined;
}

export default function TransactionsTable({
  transactions,
  loading,
  selectedCurrency,
  starredIds,
  onToggleStar,
  onRowClick,
  rates,
}: TransactionsTableProps) {
  const [hoveredUser, setHoveredUser] = useState<User | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent, user: User | null) => {
    if (!user) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 10,
    });
    setHoveredUser(user);
  };

  const handleMouseLeave = () => {
    setHoveredUser(null);
  };

  // Format Bank Account like "BOA ****4521"
  const formatBankAccount = (bank: string) => {
    const b = bank.toLowerCase();
    if (b === 'chase') return 'CHASE ****4821';
    if (b === 'boa') return 'BOA ****7892';
    if (b === 'amex') return 'AMEX ****31008';
    return bank.toUpperCase();
  };

  // Format Date to "Sep 12, 2024"
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(`${dateStr}T00:00:00Z`);
    if (isNaN(date.getTime())) return dateStr;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = months[date.getUTCMonth()];
    const d = date.getUTCDate();
    const y = date.getUTCFullYear();
    return `${m} ${d}, ${y}`;
  };

  // Format initials helper
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarBg = (name: string) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'from-blue-600 to-indigo-600',
      'from-emerald-600 to-teal-600',
      'from-violet-600 to-purple-600',
      'from-amber-600 to-orange-600',
      'from-rose-600 to-pink-600',
    ];
    return colors[hash % colors.length];
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 border border-[#161720] rounded-xl bg-[#090a0f]/50">
        <svg className="animate-spin h-8 w-8 text-sky-500 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs tracking-wider uppercase text-gray-500 font-light">Loading Transactions...</span>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 border border-[#161720] rounded-xl bg-[#090a0f]/50 text-center px-4">
        <svg className="w-12 h-12 text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-sm font-medium text-gray-400">No Transactions Found</h3>
        <p className="text-xs text-gray-600 mt-1 font-light">Try adjusting your active search filters.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-x-auto border border-[#161720] rounded-xl bg-[#090a0f]/80 shadow-2xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#161720] text-[10px] text-gray-500 tracking-wider uppercase font-semibold bg-[#090a0f]/80">
            <th className="py-4 px-6 w-10"></th>
            <th className="py-4 px-6">Transaction</th>
            <th className="py-4 px-6">Amount</th>
            <th className="py-4 px-6">Date</th>
            <th className="py-4 px-6">Category</th>
            <th className="py-4 px-6">Bank Acc.</th>
            <th className="py-4 px-6">Authorized By</th>
            <th className="py-4 px-6">Vendor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dashed divide-[#222431] text-xs">
          {transactions.map((tx) => {
            const isNegative = tx.amount < 0;
            const isStarred = starredIds.has(tx.id);
            
            let displayAmountStr = '';
            if (selectedCurrency === 'original') {
              displayAmountStr = formatCurrencyClient(Math.abs(tx.amount), tx.currency);
            } else if (rates) {
              const converted = convertCurrencyClient(tx.amount, tx.currency, selectedCurrency, rates);
              displayAmountStr = formatCurrencyClient(Math.abs(converted), selectedCurrency);
            } else {
              displayAmountStr = formatCurrencyClient(Math.abs(tx.amount), tx.currency);
            }

            // Standardize output to include currency code prefix like "USD $12,480.00"
            const currencyCodePrefix = (selectedCurrency === 'original' ? tx.currency : selectedCurrency).toUpperCase();
            const fullAmountDisplay = `${currencyCodePrefix} ${displayAmountStr}`;

            return (
              <tr
                key={tx.id}
                onClick={() => onRowClick(tx)}
                className="hover:bg-[#161722]/30 transition-colors duration-150 cursor-pointer group"
              >
                {/* Star Toggle */}
                <td className="py-4 px-6 text-center" onClick={(e) => onToggleStar(tx.id, e)}>
                  <svg
                    className={`w-4 h-4 transition-colors duration-150 ${
                      isStarred
                        ? 'text-sky-400 fill-sky-500/35'
                        : 'text-gray-600 hover:text-gray-400 fill-none'
                    }`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.48 3.499c.174-.287.568-.287.742 0l2.368 3.903c.094.156.248.267.427.303l4.316.89c.328.068.46.47.222.716l-3.238 3.336a.75.75 0 0 0-.203.626l1.012 4.41c.077.337-.282.597-.577.411l-3.83-2.392a.75.75 0 0 0-.75 0l-3.83 2.392c-.295.186-.654-.074-.577-.411l1.012-4.41a.75.75 0 0 0-.203-.626L2.923 10.02c-.238-.246-.106-.648.222-.716l4.316-.89a.75.75 0 0 0 .427-.303L11.48 3.5Z"
                    />
                  </svg>
                </td>
                
                {/* Transaction name (description) */}
                <td className="py-4 px-6 font-medium text-gray-300 group-hover:text-white transition-colors duration-150 max-w-[200px] truncate">
                  {tx.description || tx.vendor || 'Untitled Transaction'}
                </td>

                {/* Amount */}
                <td className={`py-4 px-6 font-medium text-sm transition-colors duration-150 ${
                  isNegative ? 'text-red-400/90' : 'text-emerald-400/90'
                }`}>
                  {fullAmountDisplay}
                </td>

                {/* Date */}
                <td className="py-4 px-6 text-gray-400 font-light">
                  {formatDate(tx.date)}
                </td>

                {/* Category */}
                <td className="py-4 px-6 text-gray-400 font-light">
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-light uppercase tracking-wider">
                    {tx.category}
                  </span>
                </td>

                {/* Bank Account */}
                <td className="py-4 px-6 text-gray-400 font-light">
                  {formatBankAccount(tx.bank)}
                </td>

                {/* Authorized By */}
                <td className="py-4 px-6 text-gray-400 font-light">
                  {tx.authorizedBy ? (
                    <span
                      onMouseEnter={(e) => handleMouseEnter(e, tx.authorizedBy)}
                      onMouseLeave={handleMouseLeave}
                      className="underline decoration-dotted decoration-gray-600 hover:decoration-white hover:text-white cursor-help transition-colors duration-150 py-1"
                    >
                      {tx.authorizedBy.name}
                    </span>
                  ) : (
                    <span className="text-gray-600 italic">System / Auto</span>
                  )}
                </td>

                {/* Vendor */}
                <td className="py-4 px-6 text-gray-300 font-medium">
                  {tx.vendor}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Authorized By Tooltip */}
      {hoveredUser && (
        <div
          className="absolute z-50 p-4 w-72 bg-[#12131a] border border-[#27272a] rounded-lg shadow-2xl pointer-events-none transition-all duration-150 flex items-start space-x-3 text-white font-sans animate-fade-in"
          style={{
            position: 'fixed',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className={`h-11 w-11 rounded-full bg-gradient-to-tr ${getAvatarBg(hoveredUser.name)} flex items-center justify-center text-sm font-bold text-white shadow-md border border-white/10 shrink-0`}>
            {getInitials(hoveredUser.name)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-white tracking-wide truncate">{hoveredUser.name}</h4>
            <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase mt-0.5 truncate">{hoveredUser.title}</p>
            
            <div className="mt-2 border-t border-[#1e1f29] pt-2 space-y-1">
              <p className="text-[10px] text-gray-500 truncate">
                <span className="font-semibold text-gray-400">Email:</span> {hoveredUser.email}
              </p>
              <p className="text-[10px] text-gray-500 capitalize">
                <span className="font-semibold text-gray-400">Role:</span> {hoveredUser.role.replace('_', ' ')}
              </p>
              <p className="text-[10px] text-gray-500">
                <span className="font-semibold text-gray-400">Dept:</span> {hoveredUser.department}
              </p>
            </div>
          </div>

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[5px] w-2.5 h-2.5 bg-[#12131a] border-r border-b border-[#27272a] rotate-45" />
        </div>
      )}
    </div>
  );
}
