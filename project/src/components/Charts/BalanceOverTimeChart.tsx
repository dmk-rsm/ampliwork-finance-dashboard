'use client';

import React, { useState } from 'react';
import { formatCurrencyClient } from '../../lib/currency_client';

interface BalanceDataPoint {
  monthKey: string;
  monthName: string;
  chase: number;
  boa: number;
  amex: number;
}

interface BalanceOverTimeChartProps {
  data: BalanceDataPoint[];
  loading?: boolean;
}

export default function BalanceOverTimeChart({ data, loading }: BalanceOverTimeChartProps) {
  const [selectedBank, setSelectedBank] = useState<'all' | 'chase' | 'boa' | 'amex'>('boa');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (loading) {
    return (
      <div className="h-80 w-full flex items-center justify-center bg-[#0d0e14]/50 border border-[#161720] rounded-xl">
        <svg className="animate-spin h-6 w-6 text-sky-500 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs text-gray-500 uppercase tracking-wider font-light">Loading balance history...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center bg-[#0d0e14]/50 border border-[#161720] rounded-xl text-gray-500 text-xs">
        No balance history available.
      </div>
    );
  }

  // Dimensions
  const width = 800;
  const height = 300;
  const paddingLeft = 70;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Get value for a data point depending on the selected bank
  const getPointValue = (d: BalanceDataPoint) => {
    switch (selectedBank) {
      case 'chase':
        return d.chase;
      case 'boa':
        return d.boa;
      case 'amex':
        return d.amex;
      default:
        return d.chase + d.boa + d.amex; // ALL
    }
  };

  // Find max and min values for Y-axis scaling
  const values = data.map(getPointValue);
  const maxVal = Math.max(...values, 1000);
  const minVal = Math.min(...values, 0);

  const delta = maxVal - minVal;
  const yMin = minVal - delta * 0.1;
  const yMax = maxVal + delta * 0.1;

  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const range = yMax - yMin;
    if (range === 0) return paddingTop + chartHeight / 2;
    const ratio = (val - yMin) / range;
    return paddingTop + chartHeight - ratio * chartHeight;
  };

  // Build SVG path string
  const buildPath = () => {
    return data
      .map((d, index) => {
        const x = getX(index);
        const y = getY(getPointValue(d));
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const linePath = buildPath();

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const relativeX = clientX - (rect.width * paddingLeft) / width;
    const scaledChartWidth = (rect.width * chartWidth) / width;
    
    let index = Math.round((relativeX / scaledChartWidth) * (data.length - 1));
    index = Math.max(0, Math.min(data.length - 1, index));

    const hoverX = getX(index);
    const hoverY = getY(getPointValue(data[index]));

    setHoveredIndex(index);
    setTooltipPos({
      x: hoverX,
      y: hoverY - 10,
    });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const yTicks = 4;

  return (
    <div className="relative w-full p-6 bg-[#0d0e14]/80 border border-[#161720] rounded-xl shadow-lg flex flex-col h-full justify-between">
      {/* Panel Header with Bank Dropdown */}
      <div className="flex items-center justify-between mb-6 border-b border-[#161720]/80 pb-4">
        <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-white">
          Bank Account Balance
        </h4>
        
        {/* Styled Dropdown matching wireframe select */}
        <div className="relative">
          <select
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value as 'all' | 'chase' | 'boa' | 'amex')}
            className="appearance-none bg-[#090a0f] border border-[#27272a] hover:border-gray-500 rounded px-3 pr-7 py-1 text-[10px] tracking-wider uppercase text-gray-300 font-semibold cursor-pointer outline-none transition-colors"
          >
            <option value="all">ALL</option>
            <option value="boa">BOA</option>
            <option value="chase">CHASE</option>
            <option value="amex">AMEX</option>
          </select>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-500 text-[8px]">&#9660;</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto scrollbar-thin">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none cursor-crosshair"
          style={{ minWidth: '650px' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Y Axis Grid lines and labels */}
          {Array.from({ length: yTicks + 1 }).map((_, i) => {
            const val = yMin + ((yMax - yMin) / yTicks) * i;
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
                  {/* Format as 100 K, 80 K etc. */}
                  {val >= 1000 ? `${Math.round(val / 1000)} K` : `${Math.round(val)}`}
                </text>
              </g>
            );
          })}

          {/* Line Curve (styled as mockup blue) */}
          <path
            d={linePath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Data point white dots markers */}
          {data.map((d, index) => {
            const x = getX(index);
            const y = getY(getPointValue(d));
            return (
              <circle
                key={d.monthKey}
                cx={x}
                cy={y}
                r={3.5}
                fill="#ffffff"
                stroke="#38bdf8"
                strokeWidth={1.5}
                className="transition-all duration-300"
              />
            );
          })}

          {/* X Axis Labels */}
          {data.map((d, index) => {
            const x = getX(index);
            // Show every second month label to avoid crowd
            if (index % 2 !== 0 && index !== data.length - 1) return null;
            return (
              <text
                key={d.monthKey}
                x={x}
                y={paddingTop + chartHeight + 16}
                textAnchor="middle"
                fill="#6b7280"
                className="text-[9px] uppercase tracking-wider font-semibold"
              >
                {d.monthName}
              </text>
            );
          })}

          {/* Active Hover vertical line */}
          {hoveredIndex !== null && (
            <line
              x1={getX(hoveredIndex)}
              y1={paddingTop}
              x2={getX(hoveredIndex)}
              y2={paddingTop + chartHeight}
              stroke="#4b5563"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          )}
        </svg>
      </div>

      {/* Floating Tooltip */}
      {hoveredIndex !== null && (
        <div
          className="absolute z-10 px-3 py-2 bg-[#161722] border border-[#27272a] rounded shadow-xl text-center pointer-events-none"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">
            {data[hoveredIndex].monthName}
          </p>
          <p className="text-xs font-bold text-sky-400 mt-1">
            {formatCurrencyClient(getPointValue(data[hoveredIndex]), 'USD')}
          </p>
          <span className="text-[8px] uppercase tracking-wide text-gray-400 block mt-0.5 capitalize">
            {selectedBank} Balance
          </span>
        </div>
      )}
    </div>
  );
}
