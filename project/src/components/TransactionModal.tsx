'use client';

import React from 'react';
import { NormalizedTransaction } from '../types';
import { formatCurrencyClient } from '../lib/currency_client';

interface TransactionModalProps {
  transaction: NormalizedTransaction | null;
  onClose: () => void;
}

export default function TransactionModal({
  transaction,
  onClose,
}: TransactionModalProps) {
  if (!transaction) return null;

  const isNegative = transaction.amount < 0;
  const displayAmountStr = formatCurrencyClient(Math.abs(transaction.amount), transaction.currency);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getBankName = (bank: string) => {
    switch (bank.toLowerCase()) {
      case 'chase':
        return 'Chase Business Checking';
      case 'boa':
        return 'Bank of America Treasury';
      case 'amex':
        return 'American Express Business Gold';
      default:
        return bank;
    }
  };

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div className="w-full max-w-2xl bg-[#0d0e14] border border-[#1e1f2b] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#161720] flex items-center justify-between bg-[#090a0f]">
          <div className="flex items-center space-x-3">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <h3 className="text-sm font-semibold tracking-wider uppercase text-white">Transaction Breakdown</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-all duration-150"
          >
            {/* Close Icon */}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Info Hero */}
          <div className="text-center py-6 bg-[#090a0f]/60 rounded-lg border border-[#161720]/80">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{transaction.vendor}</p>
            <h2 className={`text-3xl font-semibold tracking-tight mt-2 ${
              isNegative ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {isNegative ? '-' : '+'}{displayAmountStr}
            </h2>
            <p className="text-xs text-gray-400 mt-2 font-light">{transaction.date}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#090a0f]/40 rounded-lg border border-[#161720]/50 space-y-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Bank Account</span>
              <p className="text-xs font-semibold text-white capitalize">{getBankName(transaction.bank)}</p>
            </div>
            
            <div className="p-4 bg-[#090a0f]/40 rounded-lg border border-[#161720]/50 space-y-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Category</span>
              <p className="text-xs font-semibold text-white capitalize">{transaction.category}</p>
            </div>

            <div className="p-4 bg-[#090a0f]/40 rounded-lg border border-[#161720]/50 space-y-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Authorized By</span>
              <p className="text-xs font-semibold text-white">
                {transaction.authorizedBy ? transaction.authorizedBy.name : 'System / Auto-authorized'}
              </p>
            </div>

            <div className="p-4 bg-[#090a0f]/40 rounded-lg border border-[#161720]/50 space-y-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Internal Reference ID</span>
              <p className="text-xs font-mono text-zinc-400 break-all">{transaction.id}</p>
            </div>
          </div>

          {/* Collapsible raw data */}
          <div className="space-y-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Raw Bank Ledger Object</span>
            <div className="bg-[#050609] border border-[#161720] rounded-lg overflow-hidden">
              <pre className="p-4 text-[10px] text-emerald-400/90 font-mono overflow-x-auto max-h-48 leading-relaxed whitespace-pre-wrap scrollbar-thin">
                {JSON.stringify(transaction.source, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#161720] bg-[#090a0f] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs tracking-wider uppercase font-medium transition-all duration-150"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
