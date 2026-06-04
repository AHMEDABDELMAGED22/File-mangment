"use client";

import { useRef, useEffect } from "react";

interface BarChartItem {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartItem[];
  title?: string;
  maxBars?: number;
  accentColor?: string;
}

export function BarChart({ data, title, maxBars = 10, accentColor = "#8b5cf6" }: BarChartProps) {
  const items = data.slice(0, maxBars);
  const maxValue = Math.max(...items.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {title && <h4 className="text-sm font-medium text-zinc-400">{title}</h4>}
      <div className="space-y-2">
        {items.map((item, i) => {
          const widthPct = (item.value / maxValue) * 100;
          const isTop = i === 0;
          return (
            <div key={`${item.label}-${i}`} className="group flex items-center gap-3">
              {/* Rank */}
              <span className={`w-6 text-right text-xs font-mono ${isTop ? "text-amber-400 font-bold" : "text-zinc-500"}`}>
                {i + 1}
              </span>
              {/* Name */}
              <span
                className={`w-28 sm:w-40 truncate text-xs ${isTop ? "text-amber-300 font-semibold" : "text-zinc-400"}`}
                title={item.label}
                dir="auto"
              >
                {item.label}
              </span>
              {/* Bar */}
              <div className="flex-1 h-6 bg-zinc-800/60 rounded-md overflow-hidden relative">
                <div
                  className="h-full rounded-md transition-all duration-700 ease-out"
                  style={{
                    width: `${widthPct}%`,
                    background: isTop
                      ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                      : `linear-gradient(90deg, ${accentColor}, ${accentColor}88)`,
                    animationDelay: `${i * 60}ms`,
                  }}
                />
                <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold ${isTop ? "text-amber-100" : "text-zinc-300"}`}>
                  {item.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {data.length === 0 && (
        <p className="text-zinc-500 text-sm text-center py-6">No data available</p>
      )}
    </div>
  );
}
