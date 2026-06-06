'use client';

import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import TransactionsTable from '../../../components/TransactionsTable';
import TransactionModal from '../../../components/TransactionModal';
import { NormalizedTransaction, User } from '../../../types';
import { convertCurrencyClient } from '../../../lib/currency_client';
import { authFetcher } from '../../../lib/auth';

export default function TransactionsTab() {
  const [bankFilter, setBankFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('original'); // original, USD, EUR, GBP, CAD
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<NormalizedTransaction | null>(null);

  // Starred Transactions IDs State (persisted in localStorage)
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'starred'>('all');

  // Fetch exchange rates and user directory dynamically via Next.js API Routes (no JSON imports)
  const { data: ratesData } = useSWR('/api/rates', authFetcher);
  const { data: usersData } = useSWR('/api/users', authFetcher);

  const rates = ratesData?.rates;
  const usersList = usersData?.users || [];

  // Load Starred IDs on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('circuit_starred_transactions');
      if (stored) {
        setStarredIds(new Set(JSON.parse(stored)));
      }
    } catch (err) {
      console.error('Failed to load starred items', err);
    }
  }, []);

  // Save Starred IDs when changed
  const saveStarredIds = (newSet: Set<string>) => {
    setStarredIds(newSet);
    try {
      localStorage.setItem('circuit_starred_transactions', JSON.stringify(Array.from(newSet)));
    } catch (err) {
      console.error('Failed to save starred items', err);
    }
  };

  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid row click modal trigger
    const newSet = new Set(starredIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    saveStarredIds(newSet);
  };

  // Fetch transactions from API with core filters applied
  const queryParams = new URLSearchParams();
  if (bankFilter !== 'all') queryParams.append('bank', bankFilter);
  if (userFilter !== 'all') queryParams.append('authorizedBy', userFilter);
  if (fromDateFilter) queryParams.append('fromDate', fromDateFilter);
  if (amountFilter) queryParams.append('amount', amountFilter);

  const { data: transactions, error, isValidating } = useSWR<NormalizedTransaction[]>(
    `/api/transactions?${queryParams.toString()}`,
    authFetcher
  );

  const loading = !transactions && !error;

  // CSV Export Handler (downloads all matches under active query filters)
  const handleCSVExport = () => {
    if (!transactions || transactions.length === 0) return;

    const exportList = activeTab === 'all' 
      ? transactions 
      : transactions.filter(t => starredIds.has(t.id));

    if (exportList.length === 0) return;

    const headers = ['Date', 'Vendor', 'Original Amount', 'Original Currency', 'Converted Amount', 'Display Currency', 'Category', 'Bank Account', 'Authorized By'];

    const rows = exportList.map((tx) => {
      let displayAmt = tx.amount;
      let displayCurr = tx.currency;

      if (currencyFilter !== 'original' && rates) {
        displayAmt = convertCurrencyClient(tx.amount, tx.currency, currencyFilter, rates);
        displayCurr = currencyFilter;
      }

      return [
        tx.date,
        `"${tx.vendor.replace(/"/g, '""')}"`,
        tx.amount.toFixed(2),
        tx.currency,
        displayAmt.toFixed(2),
        displayCurr,
        tx.category,
        tx.bank.toUpperCase(),
        tx.authorizedBy ? `"${tx.authorizedBy.name}"` : 'System / Auto',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `circuit_transactions_${activeTab}_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter list by "Starred" tab client-side if active
  const filteredList = transactions 
    ? transactions.filter(tx => activeTab === 'all' || starredIds.has(tx.id))
    : [];

  // Limit view display to at most 30 rows
  const displayedTransactions = filteredList.slice(0, 30);

  // Count matches
  const totalMatches = transactions ? transactions.length : 0;
  const starredMatches = transactions ? transactions.filter(tx => starredIds.has(tx.id)).length : 0;

  // Create a realistic dynamic "Last Updated" timestamp
  const lastUpdatedStr = useMemo(() => {
    const now = new Date();
    return now.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) + " (Local)";
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header Row (Title, Last Updated and Filters inline) */}
      <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between border-b border-[#161720]/80 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[0.1em] uppercase text-white font-sans">
            Transactions
          </h1>
        </div>

        {/* Top Right Section: Last Updated Indicator & Inline Filters Row */}
        <div className="flex flex-col items-end space-y-3">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">
            Last Updated: {lastUpdatedStr}
          </span>

          {/* Filters Toolbar Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Auth By Selector */}
            <div className="relative">
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="appearance-none bg-[#090a0f] border border-[#27272a] hover:border-gray-500 rounded-md px-3.5 pr-8 py-2 text-[10px] tracking-wider uppercase text-gray-300 font-semibold cursor-pointer outline-none transition-colors duration-150"
              >
                <option value="all">Auth. By (All)</option>
                {usersList.map((user: User) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 text-[8px]">&#9660;</span>
            </div>

            {/* Show Currency In Selector */}
            <div className="relative">
              <select
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
                className="appearance-none bg-[#090a0f] border border-[#27272a] hover:border-gray-500 rounded-md px-3.5 pr-8 py-2 text-[10px] tracking-wider uppercase text-gray-300 font-semibold cursor-pointer outline-none transition-colors duration-150"
              >
                <option value="original">Show Currency In</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (C$)</option>
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 text-[8px]">&#9660;</span>
            </div>

            {/* Bank Acc. Selector */}
            <div className="relative">
              <select
                value={bankFilter}
                onChange={(e) => setBankFilter(e.target.value)}
                className="appearance-none bg-[#090a0f] border border-[#27272a] hover:border-gray-500 rounded-md px-3.5 pr-8 py-2 text-[10px] tracking-wider uppercase text-gray-300 font-semibold cursor-pointer outline-none transition-colors duration-150"
              >
                <option value="all">Bank Acc. (All)</option>
                <option value="chase">Chase</option>
                <option value="boa">BOA</option>
                <option value="amex">AMEX</option>
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 text-[8px]">&#9660;</span>
            </div>

            {/* Min Amount Filter */}
            <div className="relative">
              <input
                type="number"
                value={amountFilter}
                onChange={(e) => setAmountFilter(e.target.value)}
                placeholder="Min Amount"
                className="w-24 bg-[#090a0f] border border-[#27272a] hover:border-gray-500 rounded-md px-3 py-2 text-[10px] tracking-wider uppercase text-gray-300 font-semibold outline-none transition-colors duration-150 placeholder-gray-600"
              />
            </div>

            {/* Date Picker (Formatted outline box) */}
            <div className="relative flex items-center bg-[#090a0f] border border-[#27272a] hover:border-gray-500 rounded-md px-3.5 py-1 text-gray-300 transition-colors duration-150 cursor-pointer">
              {/* Calendar Icon */}
              <svg className="w-3.5 h-3.5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input
                type="date"
                value={fromDateFilter}
                onChange={(e) => setFromDateFilter(e.target.value)}
                className="bg-transparent border-none text-[10px] tracking-wider text-gray-300 uppercase font-semibold cursor-pointer outline-none py-1.5 focus:ring-0"
              />
            </div>

            {/* ↓ CSV Export Button */}
            <button
              onClick={handleCSVExport}
              disabled={filteredList.length === 0}
              className="flex items-center justify-center bg-[#090a0f] border border-[#27272a] hover:border-gray-500 disabled:opacity-30 disabled:hover:border-[#27272a] rounded-md px-4 py-2 text-[10px] tracking-wider uppercase text-gray-300 font-semibold cursor-pointer outline-none transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-6l-7 7-7-7" />
              </svg>
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Selector row (ALL vs STARRED) */}
      <div className="flex items-center border-b border-[#161720]/80 space-x-8 text-[11px] uppercase tracking-[0.15em] font-semibold text-gray-500">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 border-b-2 transition-all duration-200 ${
            activeTab === 'all' ? 'border-sky-500 text-white' : 'border-transparent hover:text-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('starred')}
          className={`pb-3 border-b-2 transition-all duration-200 ${
            activeTab === 'starred' ? 'border-sky-500 text-white' : 'border-transparent hover:text-gray-300'
          }`}
        >
          Starred ({starredMatches})
        </button>
      </div>

      {/* Validating indicator */}
      {isValidating && !loading && (
        <div className="flex items-center space-x-1.5 text-[9px] text-gray-500 uppercase tracking-widest">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
          <span>Refreshing system ledger...</span>
        </div>
      )}

      {/* Main Table */}
      {!error && (
        <TransactionsTable
          transactions={displayedTransactions}
          loading={loading}
          selectedCurrency={currencyFilter}
          starredIds={starredIds}
          onToggleStar={handleToggleStar}
          onRowClick={(tx) => setSelectedTransaction(tx)}
          rates={rates}
        />
      )}

      {/* Slicing rows info */}
      {filteredList.length > 30 && (
        <div className="text-[10px] text-gray-500 uppercase tracking-wider text-right font-light italic">
          Showing top 30 of {filteredList.length} matches. Click "CSV" to export the full list.
        </div>
      )}

      {/* Modal detail */}
      {selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}
