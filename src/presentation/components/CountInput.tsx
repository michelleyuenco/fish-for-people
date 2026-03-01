import React, { useRef, useCallback } from 'react';

interface CountInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hasDiscrepancy?: boolean;
  disabled?: boolean;
  /** Tailwind color accent for this zone, e.g. 'blue' | 'emerald' | 'violet' | 'amber' | 'slate' */
  colorAccent?: 'blue' | 'emerald' | 'violet' | 'amber' | 'slate';
}

// Per-color Tailwind classes (static strings so Tailwind picks them up)
const ACCENT = {
  blue: {
    bg: 'bg-blue-600',
    ring: 'ring-blue-300',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    border: 'border-blue-600',
    toast: 'bg-blue-600',
    label: 'text-blue-700',
  },
  emerald: {
    bg: 'bg-emerald-600',
    ring: 'ring-emerald-300',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    border: 'border-emerald-600',
    toast: 'bg-emerald-600',
    label: 'text-emerald-700',
  },
  violet: {
    bg: 'bg-violet-600',
    ring: 'ring-violet-300',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    border: 'border-violet-600',
    toast: 'bg-violet-600',
    label: 'text-violet-700',
  },
  amber: {
    bg: 'bg-amber-500',
    ring: 'ring-amber-300',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    border: 'border-amber-500',
    toast: 'bg-amber-500',
    label: 'text-amber-700',
  },
  slate: {
    bg: 'bg-slate-600',
    ring: 'ring-slate-300',
    badge: 'bg-slate-50 text-slate-700 border-slate-200',
    border: 'border-slate-500',
    toast: 'bg-slate-600',
    label: 'text-slate-700',
  },
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 0) {
      onChange(num);
    } else if (raw === '') {
      onChange(0);
    }
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
    <div
      className={`flex items-center justify-between py-3 px-4 rounded-xl border ${
        hasDiscrepancy
          ? 'border-warning bg-warning/10'
          : 'border-gray-200 bg-white'
      }`}
    >
      <span className={`text-sm font-semibold ${hasDiscrepancy ? 'text-warning' : 'text-gray-700'}`}>
        {label}
        {hasDiscrepancy && <span className="ml-1 text-warning">⚠</span>}
      </span>
      <div className="flex items-center gap-2">
        {/* Decrement — larger touch target */}
        <button
          type="button"
          onPointerDown={() => !disabled && value > 0 && startRepeat(decrement)}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          disabled={disabled || value <= 0}
          aria-label={`Decrease ${label}`}
          className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 text-xl font-bold flex items-center justify-center disabled:opacity-40 active:scale-90 transition-all select-none touch-none"
        >
          −
        </button>

        {/* Count display / direct input */}
        <input
          type="number"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          min={0}
          aria-label={`${label} count`}
          className={`w-14 text-center font-bold text-lg border-2 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            hasDiscrepancy ? 'border-warning text-warning' : 'border-gray-200 text-gray-900'
          }`}
        />

        {/* Increment — larger touch target */}
        <button
          type="button"
          onPointerDown={() => !disabled && startRepeat(increment)}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          disabled={disabled}
          aria-label={`Increase ${label}`}
          className="w-11 h-11 rounded-xl bg-primary text-white text-xl font-bold flex items-center justify-center active:scale-90 transition-all disabled:opacity-40 select-none touch-none"
        >
          <span
            className={`text-base font-extrabold tracking-wide uppercase ${
              hasDiscrepancy ? 'text-warning' : colors.label
            }`}
          >
            {label}
            {hasDiscrepancy && <span className="ml-1.5">⚠</span>}
          </span>
          {/* Direct-type input */}
          <input
            type="number"
            value={value}
            onChange={handleChange}
            disabled={disabled}
            min={0}
            inputMode="numeric"
            className={`w-16 text-center font-bold text-xl border-2 rounded-xl py-0.5
                        focus:outline-none focus:ring-2 bg-white
                        ${hasDiscrepancy
                          ? 'border-warning text-warning focus:ring-warning/30'
                          : `${colors.border} ${colors.label} ${colors.ring}`
                        }`}
          />
        </div>

        {/* Button row */}
        <div className="flex gap-2 px-3 pb-3 pt-2">
          {/* Decrement — secondary, smaller */}
          <button
            type="button"
            onPointerDown={() => startLongPress(decrement)}
            onPointerUp={stopLongPress}
            onPointerLeave={stopLongPress}
            disabled={disabled || value <= 0}
            className="flex-none w-14 h-14 rounded-xl bg-gray-100 text-gray-500 text-2xl font-bold
                       flex items-center justify-center
                       active:scale-95 transition-all disabled:opacity-30 select-none touch-none"
            aria-label={`Decrease ${label}`}
          >
            −
          </button>

          {/* Increment — primary, dominant */}
          <button
            type="button"
            onPointerDown={() => startLongPress(increment)}
            onPointerUp={stopLongPress}
            onPointerLeave={stopLongPress}
            disabled={disabled}
            className={`flex-1 h-14 rounded-xl text-white text-2xl font-bold
                        flex items-center justify-center gap-2
                        active:scale-95 transition-all disabled:opacity-40 select-none touch-none shadow-sm
                        ${colors.bg}`}
            aria-label={`Increase ${label}`}
          >
            <span className="text-2xl leading-none">+</span>
            <span className="text-sm font-semibold opacity-90">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
