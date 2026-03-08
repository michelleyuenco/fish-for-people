import React, { useRef, useCallback } from 'react';

interface CountInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hasDiscrepancy?: boolean;
  disabled?: boolean;
  colorAccent?: 'blue' | 'emerald' | 'violet' | 'amber' | 'slate';
}

const ACCENT = {
  blue:    { bg: 'bg-blue-600',    border: 'border-blue-600',    label: 'text-blue-700'    },
  emerald: { bg: 'bg-emerald-600', border: 'border-emerald-600', label: 'text-emerald-700' },
  violet:  { bg: 'bg-violet-600',  border: 'border-violet-600',  label: 'text-violet-700'  },
  amber:   { bg: 'bg-amber-500',   border: 'border-amber-500',   label: 'text-amber-700'   },
  slate:   { bg: 'bg-slate-600',   border: 'border-slate-500',   label: 'text-slate-700'   },
};

export const CountInput: React.FC<CountInputProps> = ({
  label,
  value,
  onChange,
  hasDiscrepancy = false,
  disabled = false,
  colorAccent = 'blue',
}) => {
  const repeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const colors = ACCENT[colorAccent];

  const increment = useCallback(() => onChange(value + 1), [value, onChange]);
  const decrement = useCallback(() => onChange(Math.max(0, value - 1)), [value, onChange]);

  const startRepeat = (action: () => void) => {
    action();
    repeatTimerRef.current = setTimeout(() => {
      repeatIntervalRef.current = setInterval(action, 120);
    }, 500);
  };

  const stopRepeat = () => {
    if (repeatTimerRef.current) clearTimeout(repeatTimerRef.current);
    if (repeatIntervalRef.current) clearInterval(repeatIntervalRef.current);
  };

  return (
    <div className={`rounded-xl border-2 bg-white overflow-hidden ${hasDiscrepancy ? 'border-warning' : colors.border}`}>
      {/* Label */}
      <div className={`px-3 pt-2.5 pb-2 ${hasDiscrepancy ? 'bg-warning/10' : 'bg-gray-50'}`}>
        <span className={`text-sm font-extrabold tracking-wide uppercase ${hasDiscrepancy ? 'text-warning' : colors.label}`}>
          {label}
          {hasDiscrepancy && <span className="ml-1.5">⚠</span>}
        </span>
      </div>

      {/* −  count  + */}
      <div className="flex items-center gap-3 px-4 py-4">
        <button
          type="button"
          onPointerDown={() => !disabled && value > 0 && startRepeat(decrement)}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          disabled={disabled || value <= 0}
          aria-label={`Decrease ${label}`}
          className="w-20 h-24 rounded-2xl bg-gray-100 text-gray-600 text-4xl font-bold
                     flex items-center justify-center disabled:opacity-30 active:scale-90
                     transition-all select-none touch-none flex-none"
        >−</button>
        <div className="flex-1 flex flex-col items-center">
          <span className={`text-4xl font-bold tabular-nums ${hasDiscrepancy ? 'text-warning' : colors.label}`}>{value}</span>
          <span className="text-xs text-gray-400">people</span>
        </div>
        <button
          type="button"
          onPointerDown={() => !disabled && startRepeat(increment)}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          disabled={disabled}
          aria-label={`Increase ${label}`}
          className={`w-20 h-24 rounded-2xl text-white text-4xl font-bold
                      flex items-center justify-center active:scale-90
                      transition-all disabled:opacity-40 select-none touch-none flex-none ${colors.bg}`}
        >+</button>
      </div>
    </div>
  );
};
