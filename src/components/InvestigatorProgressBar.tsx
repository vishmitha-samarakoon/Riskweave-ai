import React from 'react';

export interface InvestigatorProgressBarProps {
  currentWorkload: number;
  maxCapacity: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showStatusBadge?: boolean;
  showPercentage?: boolean;
  className?: string;
}

export interface WorkloadTheme {
  textColor: string;
  bgColor: string;
  barColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  statusLabel: string;
}

export function getWorkloadTheme(current: number, max: number): WorkloadTheme {
  const safeMax = Math.max(1, max);
  const ratio = current / safeMax;

  if (ratio >= 1) {
    return {
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-100',
      barColor: 'bg-rose-500',
      borderColor: 'border-rose-200',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700 border-rose-200',
      statusLabel: ratio > 1 ? 'Over capacity' : 'At capacity'
    };
  }

  if (ratio >= 0.75) {
    return {
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-100',
      barColor: 'bg-amber-500',
      borderColor: 'border-amber-200',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700 border-amber-200',
      statusLabel: 'Near capacity'
    };
  }

  return {
    textColor: 'text-teal-700',
    bgColor: 'bg-teal-100',
    barColor: 'bg-teal-600',
    borderColor: 'border-teal-200',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700 border-teal-200',
    statusLabel: 'Capacity available'
  };
}

export const InvestigatorProgressBar: React.FC<InvestigatorProgressBarProps> = ({
  currentWorkload,
  maxCapacity,
  size = 'md',
  showLabel = true,
  showStatusBadge = true,
  showPercentage = true,
  className = ''
}) => {
  const safeMax = Math.max(1, maxCapacity);
  const percent = Math.round((currentWorkload / safeMax) * 100);
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const remaining = Math.max(0, maxCapacity - currentWorkload);
  const theme = getWorkloadTheme(currentWorkload, safeMax);

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-2.5' : 'h-2';

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {/* Label and Statistics Header */}
      {showLabel && (
        <div className="flex items-center justify-between text-[11px] leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Workload</span>
            {showStatusBadge && (
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${theme.badgeBg} ${theme.badgeText}`}>
                {remaining > 0 ? `+${remaining} free` : 'Full'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <span className={`font-bold ${theme.textColor}`}>
              {currentWorkload} / {maxCapacity}
            </span>
            {showPercentage && (
              <span className="text-[10px] text-slate-400">
                ({percent}%)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar Container */}
      <div 
        className={`w-full ${heightClass} bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/60 shadow-inner`}
        role="progressbar"
        aria-valuenow={currentWorkload}
        aria-valuemin={0}
        aria-valuemax={maxCapacity}
        aria-label={`Workload: ${currentWorkload} of ${maxCapacity} cases (${percent}%)`}
      >
        {/* Fill bar */}
        <div 
          className={`h-full rounded-full transition-all duration-300 ease-out ${theme.barColor}`}
          style={{ width: `${clampedPercent}%` }}
        />

        {/* 75% threshold guide marker */}
        <div 
          className="absolute top-0 bottom-0 w-px bg-slate-300/70"
          style={{ left: '75%' }}
          title="75% capacity warning threshold"
        />
      </div>
    </div>
  );
};
