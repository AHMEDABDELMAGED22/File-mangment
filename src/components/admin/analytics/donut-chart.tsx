"use client";

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  title?: string;
  centerLabel?: string;
  centerValue?: string | number;
  size?: number;
}

export function DonutChart({ data, title, centerLabel, centerValue, size = 200 }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div className="space-y-3">
        {title && <h4 className="text-sm font-medium text-zinc-400">{title}</h4>}
        <p className="text-zinc-500 text-sm text-center py-6">No data available</p>
      </div>
    );
  }

  const radius = size / 2;
  const strokeWidth = size * 0.15;
  const innerRadius = radius - strokeWidth;
  const circumference = 2 * Math.PI * innerRadius;

  let cumulativeOffset = 0;
  const segments = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const pct = d.value / total;
      const dashLength = pct * circumference;
      const offset = cumulativeOffset;
      cumulativeOffset += dashLength;
      return { ...d, pct, dashLength, offset };
    });

  return (
    <div className="space-y-4">
      {title && <h4 className="text-sm font-medium text-zinc-400">{title}</h4>}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* SVG Donut */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              cx={radius}
              cy={radius}
              r={innerRadius}
              fill="none"
              stroke="#27272a"
              strokeWidth={strokeWidth}
            />
            {/* Data segments */}
            {segments.map((seg, i) => (
              <circle
                key={`${seg.label}-${i}`}
                cx={radius}
                cy={radius}
                r={innerRadius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
                strokeDashoffset={-seg.offset}
                strokeLinecap="butt"
                className="transition-all duration-700 ease-out"
                style={{
                  opacity: 0.9,
                  filter: `drop-shadow(0 0 4px ${seg.color}40)`,
                }}
              />
            ))}
          </svg>
          {/* Center text */}
          {(centerLabel || centerValue !== undefined) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {centerValue !== undefined && (
                <span className="text-2xl font-bold text-white">{centerValue}</span>
              )}
              {centerLabel && (
                <span className="text-xs text-zinc-500 mt-0.5">{centerLabel}</span>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2">
          {segments.map((seg, i) => (
            <div key={`legend-${seg.label}-${i}`} className="flex items-center gap-2.5">
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-xs text-zinc-400">{seg.label}</span>
              <span className="text-xs font-semibold text-zinc-300 ml-auto pl-3">
                {seg.value}
                <span className="text-zinc-600 ml-1">
                  ({Math.round(seg.pct * 100)}%)
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
