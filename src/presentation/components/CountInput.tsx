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
  blue:    { bg: 'bg-blue-600',    ring: 'ring-blue-300',    border: 'border-blue-600',    label: 'text-blue-700'    },
  emerald: { bg: 'bg-emerald-600', ring: 'ring-emerald-300', border: 'border-emerald-600', label: 'text-emerald-700' },
  violet:  { bg: 'bg-violet-600',  ring: 'ring-violet-300',  border: 'border-violet-600',  label: 'text-violet-700'  },
  amber:   { bg: 'bg-amber-500',   ring: 'ring-amber-300',   border: 'border-amber-500',   label: 'text-amber-700'   },
  slate:   { bg: 'bg-slate-600',   ring: 'ring-slate-300',   border: 'border-slate-500',   label: 'text-slate-700'   },
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 0) onChange(num);
    else if (raw === '') onChange(0);
  };

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
      {/* Label + current count */}
      <div className={`px-3 pt-2.5 pb-2 flex items-center justify-between ${hasDiscrepancy ? 'bg-warning/10' : 'bg-gray-50'}`}>
        <span className={`text-sm font-extrabold tracking-wide uppercase truncate max-w-[55%] ${hasDiscrepancy ? 'text-warning' : colors.label}`}>
          {label}
          {hasDiscrepancy && <span className="ml-1.5">⚠</span>}
        </span>
        <input
          type="number"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          min={0}
          inputMode="numeric"
          aria-label={`${label} count`}
          className={`w-14 text-center font-bold text-lg border-2 rounded-xl py-0.5
                      focus:outline-none focus:ring-2 bg-white
                      ${hasDiscrepancy
                        ? 'border-warning text-warning focus:ring-warning/30'
                        : `${colors.border} ${colors.label} ${colors.ring}`
                      }`}
        />
      </div>

      {/* Big ADD button + small minus */}
      <div className="flex gap-2 px-3 pb-3 pt-1">
        {/* Minus — compact, secondary */}
        <button
          type="button"
          onPointerDown={() => !disabled && value > 0 && startRepeat(decrement)}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          disabled={disabled || value <= 0}
          aria-label={`Decrease ${label}`}
          className="flex-none w-14 h-24 rounded-xl bg-gray-100 text-gray-500 text-3xl font-bold
                     flex items-center justify-center active:scale-95 transition-all
                     disabled:opacity-30 select-none touch-none"
        >−</button>

        {/* Add — tall, dominant, thumb-friendly */}
        <button
          type="button"
          onPointerDown={() => !disabled && startRepeat(increment)}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          disabled={disabled}
          aria-label={`Increase ${label}`}
          className={`flex-1 h-24 rounded-xl text-white font-bold
                      flex flex-col items-center justify-center gap-1
                      active:scale-95 transition-all disabled:opacity-40
                      select-none touch-none shadow-md ${colors.bg}`}
        >
          <span className="text-4xl leading-none">+</span>
          <span className="text-sm font-semibold opacity-90 tracking-wide">ADD</span>
        </button>
      </div>
    </div>
  );
};
