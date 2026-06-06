'use client';

import React, { useState } from 'react';
import { formatCurrencyClient } from '../../lib/currency_client';

interface MonthlyData {
  monthKey: string; // YYYY-MM
  monthName: string; // e.g. "Jun 23"
  inflow: number;
  outflow: number;
}

interface InflowOutflowChartProps {
  data: MonthlyData[];
  loading?: boolean;
}

export default function InflowOutflowChart({ data, loading }: InflowOutflowChartProps) {
  const [hoveredBar, setHoveredBar] = useState<{
    index: number;
    inflow: number;
    outflow: number;
    month: string;
    x: number;
    y: number;
  } | null>(null);

  if (loading) {
    return (
      <div className="h-80 w-full flex items-center justify-center bg-[#0d0e14]/50 border border-[#161720] rounded-xl">
        <svg className="animate-spin h-6 w-6 text-sky-500 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs text-gray-500 uppercase tracking-wider font-light">Loading chart...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center bg-[#0d0e14]/50 border border-[#161720] rounded-xl text-gray-500 text-xs">
        No data available for the chart.
      </div>
    );
  }

  // Dimensions
  const width = 800;
  const height = 300;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Stacked max calculation: sum of inflow + outflow
  const maxVal = Math.max(
    ...data.map(d => d.inflow + d.outflow),
    10000
  );

  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const yMax = Math.ceil(maxVal / (magnitude / 2)) * (magnitude / 2);

  const yTicks = 4;
  
  // Bar size settings
  const totalGroups = data.length;
  const groupWidth = chartWidth / totalGroups;
  const groupGap = groupWidth * 0.35; // margin space
  const barWidth = groupWidth - groupGap;

  const getX = (index: number) => {
    return paddingLeft + index * groupWidth + groupGap / 2;
  };

  const getY = (val: number) => {
    const ratio = val / yMax;
    return paddingTop + chartHeight - ratio * chartHeight;
  };

  const getBarHeight = (val: number) => {
    const ratio = val / yMax;
    return ratio * chartHeight;
  };

  // Convert month key to uppercase month abbreviation like "JAN", "FEB"
  const getAbbreviation = (monthName: string) => {
    return monthName.split(' ')[0].toUpperCase();
  };

  return (
    <div className="relative w-full p-6 bg-[#0d0e14]/80 border border-[#161720] rounded-xl shadow-lg flex flex-col h-full justify-between">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-6 border-b border-[#161720]/80 pb-4">
        <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-white">
          Money In vs Money Out
        </h4>
        {/* Legend */}
        <div className="flex items-center space-x-4 text-[9px] uppercase tracking-widest text-gray-400 font-semibold">
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-[#10b981] mr-1.5" />
            In
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-[#f43f5e] mr-1.5" />
            Out
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto scrollbar-thin">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none" style={{ minWidth: '650px' }}>
          {/* Definitions */}
          <defs>
            <linearGradient id="stackedInGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="stackedOutGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y Axis Labels */}
          {Array.from({ length: yTicks + 1 }).map((_, i) => {
            const val = (yMax / yTicks) * i;
            const y = getY(val);
            return (
              <g key={i} className="opacity-30">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#1f2937"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 3}
                  textAnchor="end"
                  fill="#9ca3af"
                  className="text-[9px] font-mono"
                >
                  {val >= 1000 ? `${Math.round(val / 1000)} K` : `${Math.round(val)}`}
                </text>
              </g>
            );
          })}

          {/* X Axis Line */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight}
            stroke="#1f2937"
            strokeWidth={1}
          />

          {/* Stacked Bars */}
          {data.map((d, index) => {
            const x = getX(index);
            
            // Bottom segment: Inflow (green)
            const inflowY = getY(d.inflow);
            const inflowH = getBarHeight(d.inflow);

            // Top segment: Outflow (red) stacked on top of inflow
            const outflowY = getY(d.inflow + d.outflow);
            const outflowH = getBarHeight(d.outflow);

            return (
              <g
                key={d.monthKey}
                className="cursor-pointer hover:opacity-95 transition-opacity duration-150"
                onMouseEnter={() => {
                  setHoveredBar({
                    index,
                    inflow: d.inflow,
                    outflow: d.outflow,
                    month: d.monthName,
                    x: x + barWidth / 2,
                    y: outflowY - 8,
                  });
                }}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Green Inflow Segment */}
                {d.inflow > 0 && (
                  <rect
                    x={x}
                    y={inflowY}
                    width={barWidth}
                    height={inflowH}
                    fill="url(#stackedInGrad)"
                    rx={1.5}
                  />
                )}

                {/* Red Outflow Segment sitting directly on top */}
                {d.outflow > 0 && (
                  <rect
                    x={x}
                    y={outflowY}
                    width={barWidth}
                    height={outflowH}
                    fill="url(#stackedOutGrad)"
                    rx={1.5}
                  />
                )}

                {/* Capitalized Short Month Label */}
                {(index % 2 === 0 || data.length < 13) && (
                  <text
                    x={x + barWidth / 2}
                    y={paddingTop + chartHeight + 16}
                    textAnchor="middle"
                    fill="#6b7280"
                    className="text-[9px] uppercase tracking-wider font-semibold"
                  >
                    {getAbbreviation(d.monthName)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Stacked Tooltip */}
      {hoveredBar && (
        <div
          className="absolute z-10 px-3 py-2 bg-[#161722] border border-[#27272a] rounded shadow-xl text-left pointer-events-none"
          style={{
            left: `${hoveredBar.x}px`,
            top: `${hoveredBar.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold pb-1 border-b border-zinc-800">
            {hoveredBar.month}
          </p>
          <div className="mt-1 space-y-0.5 text-[10px] font-mono">
            <p className="text-emerald-400">IN: +{formatCurrencyClient(hoveredBar.inflow, 'USD')}</p>
            <p className="text-rose-400">OUT: -{formatCurrencyClient(hoveredBar.outflow, 'USD')}</p>
            <p className="text-white border-t border-zinc-850 mt-1 pt-0.5">
              FLOW: {formatCurrencyClient(hoveredBar.inflow - hoveredBar.outflow, 'USD')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
