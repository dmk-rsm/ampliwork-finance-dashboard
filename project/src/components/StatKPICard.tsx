'use client';

import React from 'react';

interface StatKPICardProps {
  /** The formatted value to display (e.g. "6.6 M") */
  value: string;
  /** Label shown below the value (e.g. "Total Cash In") */
  label: string;
  /** Tailwind text color class for the value (e.g. "text-emerald-500") */
  valueColor: string;
  /** Whether the data is still loading */
  loading?: boolean;
}

/**
 * Reusable KPI card for the Stats dashboard.
 * Renders a large formatted value with a small uppercase label.
 */
export default function StatKPICard({
  value,
  label,
  valueColor,
  loading = false,
}: StatKPICardProps) {
  return (
    <div className="p-6 bg-[#0d0e14]/80 border border-[#161720] rounded-xl shadow-lg flex items-center space-x-5">
      {loading ? (
        <div className="h-12 bg-zinc-800 rounded animate-pulse w-20" />
      ) : (
        <span className={`text-4xl font-semibold tracking-tight font-sans ${valueColor}`}>
          {value}
        </span>
      )}
      <div className="flex flex-col">
        <span className="text-[10px] tracking-wider uppercase text-gray-500 font-bold">
          {label}
        </span>
      </div>
    </div>
  );
}
