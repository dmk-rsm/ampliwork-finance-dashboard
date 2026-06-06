'use client';

import React, { useMemo } from 'react';
import useSWR from 'swr';
import InflowOutflowChart from '../../../components/Charts/InflowOutflowChart';
import BalanceOverTimeChart from '../../../components/Charts/BalanceOverTimeChart';
import StatKPICard from '../../../components/StatKPICard';
import { NormalizedTransaction } from '../../../types';
import { convertCurrencyClient, formatCurrencyClient } from '../../../lib/currency_client';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Final balances as of 2025-05-31
const CHASE_FINAL_BALANCE = 284750.42;
const BOA_FINAL_BALANCE = 6324448.17;
const AMEX_FINAL_BALANCE = 24842.17;

// Month key to name helper: "2023-06" -> "Jun 23"
const getMonthName = (monthKey: string) => {
  const [year, month] = monthKey.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mIndex = parseInt(month, 10) - 1;
  const shortYear = year.slice(2);
  return `${months[mIndex]} ${shortYear}`;
};

// Ordinal date helper: "12" -> "12th"
const getOrdinalSuffix = (day: number) => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:  return 'st';
    case 2:  return 'nd';
    case 3:  return 'rd';
    default: return 'th';
  }
};

// Format Date like "SEP 12th, 2024"
const formatMockupDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T00:00:00Z`);
  if (isNaN(date.getTime())) return dateStr;
  
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const m = months[date.getUTCMonth()];
  const d = date.getUTCDate();
  const y = date.getUTCFullYear();
  return `${m} ${d}${getOrdinalSuffix(d)}, ${y}`;
};

// Format Amount like "USD $70 000" (space thousands separator)
const formatMockupAmount = (amount: number, currency: string = 'USD') => {
  const rounded = Math.round(Math.abs(amount));
  const spaceFormatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : 'C$';
  return `${currency} ${symbol}${spaceFormatted}`;
};

// Format Category amount like "872.400" (dot thousands separator)
const formatCategoryAmount = (amount: number) => {
  const rounded = Math.round(amount);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Format Millions KPI like "6.6 M"
const formatMillionsKPI = (amount: number) => {
  const millions = amount / 1000000;
  return `${millions.toFixed(1)} M`;
};

export default function StatsTab() {
  const { data: transactions, error: transactionsError } = useSWR<NormalizedTransaction[]>(
    '/api/transactions',
    fetcher
  );

  const { data: ratesData, error: ratesError } = useSWR(
    '/api/rates',
    fetcher
  );

  const rates = ratesData?.rates;
  const loading = (!transactions && !transactionsError) || (!ratesData && !ratesError);

  const stats = useMemo(() => {
    if (!transactions || transactions.length === 0 || !rates) return null;

    let totalCashIn = 0;
    let totalCashOut = 0;
    const vendorMap: Record<string, { totalSpend: number; lastDate: string }> = {};
    const categoryMap: Record<string, number> = {};
    const userSpenderMap: Record<string, number> = {}; // User name -> spend amount

    const monthlyMap: Record<string, { inflow: number; outflow: number }> = {};
    
    // Group tx by bank to compute starting balances
    let chaseTxSumUSD = 0;
    let boaTxSumUSD = 0;
    let amexTxSumUSD = 0;

    transactions.forEach((tx) => {
      const amountUSD = convertCurrencyClient(tx.amount, tx.currency, 'USD', rates);
      
      // Accumulate totals for start balance calculation
      if (tx.bank === 'chase') chaseTxSumUSD += amountUSD;
      if (tx.bank === 'boa') boaTxSumUSD += amountUSD;
      if (tx.bank === 'amex') amexTxSumUSD += amountUSD;

      // Inflow / Outflow KPI Math
      if (amountUSD > 0) {
        totalCashIn += amountUSD;
      } else {
        totalCashOut += Math.abs(amountUSD);
      }

      // Grouping category & vendor spend (debits/outflows only)
      if (amountUSD < 0) {
        const spendVal = Math.abs(amountUSD);
        
        const category = tx.category || 'Other';
        categoryMap[category] = (categoryMap[category] || 0) + spendVal;

        const vendor = tx.vendor || 'Unknown Vendor';
        if (!vendorMap[vendor]) {
          vendorMap[vendor] = { totalSpend: 0, lastDate: tx.date };
        }
        vendorMap[vendor].totalSpend += spendVal;
        
        // Track last date chronologically
        const currentLast = new Date(vendorMap[vendor].lastDate).getTime();
        const txTime = new Date(tx.date).getTime();
        if (txTime > currentLast) {
          vendorMap[vendor].lastDate = tx.date;
        }

        // Top Spender calculations
        if (tx.authorizedBy) {
          const uName = tx.authorizedBy.name;
          userSpenderMap[uName] = (userSpenderMap[uName] || 0) + spendVal;
        }
      }

      // Monthly aggregations
      const monthKey = tx.date.slice(0, 7);
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { inflow: 0, outflow: 0 };
      }

      if (amountUSD > 0) {
        monthlyMap[monthKey].inflow += amountUSD;
      } else {
        monthlyMap[monthKey].outflow += Math.abs(amountUSD);
      }
    });

    // Rank Category Spend
    const rankedCategories = Object.entries(categoryMap)
      .map(([name, totalSpend]) => ({ name, totalSpend }))
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 5); // top 5

    // Rank Vendors
    const rankedVendors = Object.entries(vendorMap)
      .map(([name, val]) => ({ name, totalSpend: val.totalSpend, lastDate: val.lastDate }))
      .sort((a, b) => b.totalSpend - a.totalSpend);

    // User Spender concentrations
    const totalSpenderSum = Object.values(userSpenderMap).reduce((sum, v) => sum + v, 0);
    const spenderShares = Object.entries(userSpenderMap)
      .map(([fullName, spend]) => {
        const firstName = fullName.split(' ')[0].toUpperCase();
        const percentage = totalSpenderSum > 0 ? (spend / totalSpenderSum) * 100 : 0;
        return {
          fullName,
          firstName,
          spend,
          percentage,
        };
      })
      .sort((a, b) => b.spend - a.spend);

    // Monthly Inflow / Outflow sorted keys
    const monthsSorted = Object.keys(monthlyMap).sort();
    const inflowOutflowData = monthsSorted.map((key) => ({
      monthKey: key,
      monthName: getMonthName(key),
      inflow: monthlyMap[key].inflow,
      outflow: monthlyMap[key].outflow,
    }));

    // Balance history calculation (Chase, BoA, Amex curve values)
    const chaseStart = CHASE_FINAL_BALANCE - chaseTxSumUSD;
    const boaStart = BOA_FINAL_BALANCE - boaTxSumUSD;
    const amexStart = AMEX_FINAL_BALANCE - amexTxSumUSD;

    let chaseRunning = chaseStart;
    let boaRunning = boaStart;
    let amexRunning = amexStart;

    const monthlyBalances: Record<string, { chase: number; boa: number; amex: number }> = {};

    transactions.forEach((tx) => {
      const amountUSD = convertCurrencyClient(tx.amount, tx.currency, 'USD', rates);
      if (tx.bank === 'chase') chaseRunning += amountUSD;
      if (tx.bank === 'boa') boaRunning += amountUSD;
      if (tx.bank === 'amex') amexRunning += amountUSD;

      const monthKey = tx.date.slice(0, 7);
      monthlyBalances[monthKey] = {
        chase: chaseRunning,
        boa: boaRunning,
        amex: amexRunning,
      };
    });

    const balanceHistoryData = monthsSorted.map((key) => {
      const balances = monthlyBalances[key] || {
        chase: chaseRunning,
        boa: boaRunning,
        amex: amexRunning,
      };
      return {
        monthKey: key,
        monthName: getMonthName(key),
        chase: balances.chase,
        boa: balances.boa,
        amex: balances.amex,
      };
    });

    return {
      totalCashIn,
      totalCashOut,
      rankedCategories,
      rankedVendors,
      spenderShares,
      inflowOutflowData: inflowOutflowData.slice(-6), // slice to latest 6 months for stacked chart
      balanceHistoryData: balanceHistoryData.slice(-12), // slice to latest 12 months for line chart
    };
  }, [transactions, rates]);

  // Color config for spender segmented bar
  const getSpenderColor = (name: string) => {
    switch (name) {
      case 'ALEX':
        return 'bg-sky-500'; // blue
      case 'PRIYA':
        return 'bg-rose-500'; // red
      case 'MARCUS':
        return 'bg-emerald-500'; // green/cyan
      case 'JORDAN':
        return 'bg-amber-400'; // yellow/amber
      default:
        return 'bg-zinc-500';
    }
  };

  const getSpenderTextColor = (name: string) => {
    switch (name) {
      case 'ALEX':
        return 'text-sky-400';
      case 'PRIYA':
        return 'text-rose-400';
      case 'MARCUS':
        return 'text-emerald-400';
      case 'JORDAN':
        return 'text-amber-400';
      default:
        return 'text-zinc-500';
    }
  };

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
      {/* Top Header Row */}
      <div className="flex items-center justify-between border-b border-[#161720]/80 pb-4">
        <h1 className="text-2xl font-semibold tracking-[0.1em] uppercase text-white font-sans">
          Stats
        </h1>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">
          Last Updated: {lastUpdatedStr}
        </span>
      </div>

      {/* Main Grid: Mockup layout panels */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: KPIs and Charts (3/5 cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Top Row: Two KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatKPICard 
              label="Total Cash In"
              value={stats ? formatMillionsKPI(stats.totalCashIn) : '0.0 M'}
              valueColor="text-[#10b981]"
              loading={loading}
            />

            <StatKPICard 
              label="Total Outflow"
              value={stats ? formatMillionsKPI(stats.totalCashOut) : '0.0 M'}
              valueColor="text-[#f43f5e]"
              loading={loading}
            />
          </div>

          {/* Line Chart Panel: Bank Balance */}
          <div className="h-[380px]">
            <BalanceOverTimeChart
              data={stats ? stats.balanceHistoryData : []}
              loading={loading}
            />
          </div>

          {/* Stacked Bar Chart Panel: Inflow vs Outflow */}
          <div className="h-[380px]">
            <InflowOutflowChart
              data={stats ? stats.inflowOutflowData : []}
              loading={loading}
            />
          </div>

        </div>

        {/* Right Side: Category lists, Top Vendors, Spenders (2/5 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Panel: WHERE DOES YOUR MONEY GO? */}
          <div className="p-6 bg-[#0d0e14]/80 border border-[#161720] rounded-xl shadow-lg space-y-5">
            <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-white">
              Where does your money go?
            </h4>
            
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between"><div className="h-3 bg-zinc-800 rounded w-20 animate-pulse" /><div className="h-3 bg-zinc-800 rounded w-12 animate-pulse" /></div>
                    <div className="h-1.5 bg-zinc-800 rounded animate-pulse" />
                  </div>
                ))
              ) : stats && stats.rankedCategories.length > 0 ? (
                stats.rankedCategories.map((cat, idx) => {
                  const maxVal = stats.rankedCategories[0].totalSpend || 1;
                  const percent = (cat.totalSpend / maxVal) * 100;
                  
                  return (
                    <div key={cat.name} className="space-y-2 font-sans">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-300 font-medium">{cat.name}</span>
                        <span className="text-gray-400 font-mono font-medium">
                          {formatCategoryAmount(cat.totalSpend)}
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="h-1 bg-[#1e202e] rounded-full w-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">No spending data available.</p>
              )}
            </div>
          </div>

          {/* Panel: TOP 4 PAID VENDORS */}
          <div className="p-6 bg-[#0d0e14]/80 border border-[#161720] rounded-xl shadow-lg space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-white">
              Top Vendors
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#161720]/80 text-[9px] text-gray-500 tracking-wider uppercase font-semibold">
                    <th className="py-2.5 px-2">Vendor</th>
                    <th className="py-2.5 px-2">Last Transaction</th>
                    <th className="py-2.5 px-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#161720]/40 font-light">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-2"><div className="h-3.5 bg-zinc-800 rounded animate-pulse w-12" /></td>
                        <td className="py-3 px-2"><div className="h-3.5 bg-zinc-800 rounded animate-pulse w-20" /></td>
                        <td className="py-3 px-2"><div className="h-3.5 bg-zinc-800 rounded animate-pulse w-16 ml-auto" /></td>
                      </tr>
                    ))
                  ) : stats && stats.rankedVendors.length > 0 ? (
                    stats.rankedVendors.map((vendor) => (
                      <tr key={vendor.name} className="hover:bg-[#161722]/10 transition-colors">
                        <td className="py-3 px-2 font-medium text-gray-300">
                          {vendor.name}
                        </td>
                        <td className="py-3 px-2 text-gray-500 text-[11px] font-sans">
                          {formatMockupDate(vendor.lastDate)}
                        </td>
                        <td className="py-3 px-2 text-right text-gray-300 font-mono font-medium">
                          {formatMockupAmount(vendor.totalSpend, 'USD')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-gray-600 font-light">
                        No vendor spending found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Panel: TOP SPENDER */}
          <div className="p-6 bg-[#0d0e14]/80 border border-[#161720] rounded-xl shadow-lg space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-white">
              Top Spender
            </h4>

            {/* Segmented Horizontal Progress Bar */}
            <div className="flex h-2.5 w-full bg-[#1e202e] rounded-full overflow-hidden">
              {loading ? (
                <div className="h-full w-full bg-zinc-800 animate-pulse" />
              ) : stats && stats.spenderShares.length > 0 ? (
                stats.spenderShares.map((spender) => (
                  <div
                    key={spender.fullName}
                    className={`h-full ${getSpenderColor(spender.firstName)} transition-all duration-500`}
                    style={{ width: `${spender.percentage}%` }}
                    title={`${spender.fullName}: ${spender.percentage.toFixed(1)}%`}
                  />
                ))
              ) : (
                <div className="h-full w-full bg-zinc-800" />
              )}
            </div>

            {/* Legend layout */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-[10px] uppercase tracking-wider font-semibold">
              {loading ? (
                <div className="h-4 bg-zinc-800 rounded w-32 animate-pulse" />
              ) : stats && stats.spenderShares.length > 0 ? (
                stats.spenderShares.map((spender) => (
                  <div key={spender.fullName} className="flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${getSpenderColor(spender.firstName)}`} />
                    <span className={`${getSpenderTextColor(spender.firstName)}`}>
                      {spender.firstName}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-gray-600 font-light">No spenders logged.</span>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
