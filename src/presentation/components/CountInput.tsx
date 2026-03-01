import React, { useRef, useCallback } from 'react';

interface CountInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hasDiscrepancy?: boolean;
  disabled?: boolean;
}

export const CountInput: React.FC<CountInputProps> = ({
  label,
  value,
  onChange,
  hasDiscrepancy = false,
  disabled = false,
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
          +
        </button>
      </div>
    </div>
  );
};
