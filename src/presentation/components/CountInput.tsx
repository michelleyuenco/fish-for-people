import React, { useRef, useState, useEffect } from 'react';

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
  // Long-press support for rapid increment
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Toast state: shows "+1 Zone" confirmation after each tap
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const colors = ACCENT[colorAccent];

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 1400);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const increment = () => {
    if (disabled) return;
    onChange(value + 1);
    showToast(`${label} +1`);
  };

  const decrement = () => {
    if (disabled || value <= 0) return;
    onChange(value - 1);
    showToast(`${label} −1`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value, 10);
    if (!isNaN(num) && num >= 0) onChange(num);
    else if (e.target.value === '') onChange(0);
  };

  // Long-press: hold to rapid-fire
  const startLongPress = (fn: () => void) => {
    fn(); // immediate first hit
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(fn, 80);
    }, 400);
  };

  const stopLongPress = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <div className="relative">
      {/* Confirmation toast */}
      {toast && (
        <div
          className={`absolute -top-8 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full
                      text-white text-xs font-bold shadow-md whitespace-nowrap
                      animate-bounce ${colors.toast}`}
        >
          {toast}
        </div>
      )}

      <div
        className={`rounded-2xl border-2 overflow-hidden transition-all ${
          hasDiscrepancy ? 'border-warning bg-warning/5' : `${colors.border} bg-white`
        }`}
      >
        {/* Zone label — large & prominent */}
        <div
          className={`px-4 pt-3 pb-2 flex items-center justify-between ${
            hasDiscrepancy ? 'bg-warning/10' : `${colors.badge} border-b`
          }`}
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
