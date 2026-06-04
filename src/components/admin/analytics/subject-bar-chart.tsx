"use client";

interface SubjectBarItem {
  label: string;
  value: number;
  color?: string;
}

interface SubjectBarChartProps {
  data: SubjectBarItem[];
  title?: string;
}

const DEFAULT_COLORS = [
  "#8b5cf6", "#22c55e", "#f59e0b", "#3b82f6", "#ef4444",
  "#06b6d4", "#ec4899", "#f97316", "#14b8a6", "#a855f7",
];

export function SubjectBarChart({ data, title }: SubjectBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="space-y-3">
        {title && <h4 className="text-sm font-medium text-zinc-400">{title}</h4>}
        <p className="text-zinc-500 text-sm text-center py-6">No subject data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  // Chart dimensions
  const barMaxHeight = 140;

  return (
    <div className="space-y-3">
      {title && <h4 className="text-sm font-medium text-zinc-400">{title}</h4>}
      <div className="flex items-end gap-2 sm:gap-3 justify-center pt-2 pb-1 overflow-x-auto">
        {data.map((item, i) => {
          const heightPct = (item.value / maxValue) * 100;
          const color = item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
          return (
            <div
              key={`${item.label}-${i}`}
              className="flex flex-col items-center gap-1.5 min-w-[40px] sm:min-w-[56px]"
            >
              {/* Value label */}
              <span className="text-xs font-semibold text-zinc-300">{item.value}</span>
              {/* Bar */}
              <div
                className="w-8 sm:w-10 rounded-t-md transition-all duration-700 ease-out"
                style={{
                  height: `${Math.max((heightPct / 100) * barMaxHeight, 4)}px`,
                  background: `linear-gradient(180deg, ${color}, ${color}66)`,
                  boxShadow: `0 0 12px ${color}30`,
                }}
              />
              {/* Label */}
              <span
                className="text-[10px] sm:text-xs text-zinc-500 text-center leading-tight max-w-[60px] sm:max-w-[80px] truncate"
                title={item.label}
                dir="auto"
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
